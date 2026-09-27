/**
 * Task 3.4 — Action-Taker Agent
 * Receives a call outcome (from Voice Agent Track A) and maps it
 * to a concrete action: WhatsApp order, gas booking, or payment queue entry.
 * All actions pass through guardrails before execution.
 *
 * Ordering rule: nothing is dispatched here. A call outcome can only ever move
 * a task to `awaiting_approval`; the outbound message is sent by
 * /api/tasks/:id/approve, i.e. after a human child has signed off. With live
 * WhatsApp credentials in .env, sending before approval would message a real
 * chemist off the back of a single automated IVR call.
 */
const { pool } = require('../db');
const { transitionTask } = require('./stateMachine');
const { runGuardrails } = require('./guardrails');
const { logAction } = require('./logger');
const { sendWhatsAppMessage } = require('./whatsapp');

const MAX_CALL_RETRIES = parseInt(process.env.MAX_CALL_RETRIES || '2');
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** How the Voice Agent's structured answer maps to a decision per task type. */
const DECISIONS = {
  medicine_order: {
    yes: 'dispatch',
    no: 'declined',
    unclear: 'needs_review',
    dosage_request: 'dosage_request',
    distress: 'distress',
  },
  gas_booking: {
    low: 'dispatch',
    fine: 'not_needed',
    unclear: 'needs_review',
    distress: 'distress',
  },
};

/** Legacy free-text intent, for callers that still send only parentResponse. */
const LEGACY_INTENTS = {
  confirmed_medicine: { medicine_order: 'dispatch' },
  confirmed_gas: { gas_booking: 'dispatch' },
  declined: { medicine_order: 'declined', gas_booking: 'not_needed' },
  distress: { medicine_order: 'distress', gas_booking: 'distress' },
};

/**
 * Decide what a call outcome means for this specific task.
 * Prefers the structured `responses` map; falls back to `parentResponse`.
 */
function resolveDecision(taskType, outcome) {
  const responses = outcome.responses || {};
  const key = taskType === 'gas_booking' ? 'gas' : 'medicine';
  const answer = responses[key];

  if (answer != null && DECISIONS[taskType]?.[answer]) {
    return { decision: DECISIONS[taskType][answer], answer, source: 'responses' };
  }

  const legacy = LEGACY_INTENTS[outcome.parentResponse];
  if (legacy?.[taskType]) {
    return { decision: legacy[taskType], answer: outcome.parentResponse, source: 'parentResponse' };
  }

  // No usable signal. Default to human review rather than assuming consent.
  return { decision: 'needs_review', answer: answer ?? outcome.parentResponse ?? null, source: 'default' };
}

/**
 * Resolve the call identifier to a `calls.id` UUID so action_log.call_id — a
 * UUID foreign key — can reference it. The Voice Agent sends a Twilio CallSID
 * ("CA…"), which is not a UUID; inserting it verbatim failed every INSERT and
 * silently lost the audit row. Resolving (or creating) the calls row keeps the
 * trail intact and populates retry_count for escalation.
 */
async function resolveCallRecord({ callId, callSid, taskId, callStatus, transcript, parentId }) {
  if (callId && UUID_RE.test(callId)) return callId;
  if (!callSid) return null;

  // calls.status has a CHECK constraint that does not include 'distress'.
  const statusMap = { answered: 'answered', no_answer: 'no_answer', distress: 'completed' };

  const { rows } = await pool.query('SELECT id FROM calls WHERE call_sid = $1', [callSid]);
  if (rows.length > 0) {
    await pool.query(
      `UPDATE calls SET status = $2, transcript = COALESCE($3, transcript),
              distress_flag = distress_flag OR $4, ended_at = COALESCE(ended_at, NOW())
       WHERE id = $1`,
      [rows[0].id, statusMap[callStatus] || 'initiated', transcript || null, callStatus === 'distress']
    );
    return rows[0].id;
  }

  const ins = await pool.query(
    `INSERT INTO calls (task_id, parent_id, call_sid, status, transcript, distress_flag, started_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id`,
    [taskId || null, parentId || null, callSid, statusMap[callStatus] || 'initiated', transcript || null, callStatus === 'distress']
  );
  return ins.rows[0].id;
}

/** Count prior unanswered attempts so escalation is based on real history.
 *  Read from action_log rather than calls.retry_count: Track A creates a new
 *  call_sid per attempt, so each retry is a separate calls row and the
 *  per-call counter would always read 0 and never escalate. */
async function countNoAnswers(taskId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM action_log
     WHERE task_id = $1 AND action = 'call_no_answer'`, [taskId]);
  return rows[0]?.n ?? 0;
}

/**
 * Process a call outcome and execute the appropriate action.
 * @param {object} outcome
 * @param {string} outcome.taskId
 * @param {string|null} [outcome.callId] — internal UUID, if the caller has one
 * @param {string} [outcome.callSid] — provider CallSID (Twilio). Preferred by Track A.
 * @param {string} outcome.callStatus — 'answered' | 'no_answer' | 'distress'
 * @param {string} [outcome.transcript] — raw call transcript
 * @param {string} [outcome.parentResponse] — legacy free-text intent
 * @param {object} [outcome.responses] — { medicine|gas: 'yes'|'no'|'low'|... }
 * @param {number} [outcome.amount] — payment amount if applicable
 * @param {boolean} [outcome.isApproved] — was child approval already given?
 */
async function processCallOutcome(outcome) {
  const { taskId, callId, callSid, callStatus, transcript, parentResponse, responses, amount, isApproved } = outcome;

  const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
  if (rows.length === 0) {
    console.error(`[ACTION] Task ${taskId} not found.`);
    return { success: false, error: 'Task not found' };
  }
  const task = rows[0];

  const resolvedCallId = await resolveCallRecord({
    callId, callSid, taskId, callStatus, transcript, parentId: task.parent_id,
  });
  const logCtx = { callSid: callSid || null };

  // 1. Unanswered call — escalate once retries are exhausted. Track A has
  //    already done the retrying, so the task must not sit in awaiting_call.
  if (callStatus === 'no_answer') {
    await logAction({
      taskId, callId: resolvedCallId, actor: 'action_taker',
      action: 'call_no_answer', result: 'failed', payload: logCtx,
    });
    const priorNoAnswers = await countNoAnswers(taskId);
    if (priorNoAnswers > MAX_CALL_RETRIES) {
      await transitionTask(taskId, 'couldnt_complete', {
        actor: 'action_taker', callId: resolvedCallId,
        reason: `No answer after ${MAX_CALL_RETRIES} call attempts.`,
      });
      return { success: false, action: 'no_answer_escalated', status: 'couldnt_complete' };
    }
    console.log(`[ACTION] Task ${taskId} unanswered (${priorNoAnswers}/${MAX_CALL_RETRIES}). Awaiting retry.`);
    return { success: false, action: 'no_answer_retry_pending', attempts: priorNoAnswers };
  }

  // 2. Distress — never dispatch anything; hand to the child immediately.
  const { decision } = resolveDecision(task.task_type, outcome);
  if (callStatus === 'distress' || decision === 'distress') {
    await logAction({
      taskId, callId: resolvedCallId, actor: 'action_taker',
      action: 'distress_flag_raised', result: 'escalated',
      payload: { ...logCtx, transcript: transcript?.slice(0, 200) },
    });
    await transitionTask(taskId, 'awaiting_approval', {
      actor: 'action_taker', callId: resolvedCallId,
      reason: 'Distress detected on the call. No action was taken.',
    });
    return { success: true, action: 'distress_escalated' };
  }

  // 3. Guardrails BEFORE anything else. A dosage request is a clinical
  //    decision and must never turn into a dispense order.
  const medicineAnswer = (responses || {}).medicine ?? null;
  const guardrail = await runGuardrails({
    taskId,
    type: task.task_type,
    transcript,
    amount,
    isApproved,
    dosageRequest: medicineAnswer,
  });

  if (!guardrail.allowed) {
    await transitionTask(taskId, 'awaiting_approval', {
      actor: 'guardrail', callId: resolvedCallId, reason: guardrail.reason, payload: logCtx,
    });
    return { success: false, blocked: true, reason: guardrail.reason, status: 'awaiting_approval' };
  }

  // 4. Act on the decision. Only `dispatch` proceeds; everything else either
  //    closes the task or hands it to the child.
  if (decision === 'declined' || decision === 'not_needed') {
    const reason = decision === 'declined'
      ? 'Parent declined this on the call. No order placed.'
      : 'Parent reported no action needed. Nothing to book.';
    await logAction({
      taskId, callId: resolvedCallId, actor: 'action_taker',
      action: 'parent_declined_action', result: 'success', payload: { ...logCtx, decision },
    });
    // The task is normally in awaiting_call here, whose only legal exits are
    // awaiting_approval and couldnt_complete. "The parent said no" means the
    // task cannot be completed, so couldnt_complete is the correct terminal
    // state — awaiting_call -> done is not a valid edge.
    await transitionTask(taskId, 'couldnt_complete', {
      actor: 'action_taker', callId: resolvedCallId, reason, payload: logCtx,
    });
    return { success: true, action: 'closed_without_action', decision, status: 'couldnt_complete' };
  }

  if (decision === 'needs_review') {
    const reason = 'The call answer was unclear; a human needs to decide.';
    await logAction({
      taskId, callId: resolvedCallId, actor: 'action_taker',
      action: 'flagged_for_child_review', result: 'pending_review',
      payload: { ...logCtx, transcript: transcript?.slice(0, 200) },
    });
    await transitionTask(taskId, 'awaiting_approval', {
      actor: 'action_taker', callId: resolvedCallId, reason, payload: logCtx,
    });
    return { success: true, action: 'flagged_for_child_review', status: 'awaiting_approval' };
  }

  // 5. Dispatch means: prepare the order and wait for the child. No send yet.
  let actionResult;
  if (task.task_type === 'medicine_order') {
    actionResult = await prepareMedicineOrder(task, resolvedCallId, parentResponse, logCtx);
  } else if (task.task_type === 'gas_booking') {
    actionResult = await prepareGasBooking(task, resolvedCallId, logCtx);
  } else {
    actionResult = { success: true, note: 'No specific action handler for this task type.' };
  }

  if (actionResult.needsApproval) {
    await transitionTask(taskId, 'awaiting_approval', {
      actor: 'action_taker', callId: resolvedCallId,
      reason: 'Action requires child confirmation before anything is sent.',
      payload: actionResult,
    });
  } else if (!actionResult.success) {
    await transitionTask(taskId, 'couldnt_complete', {
      actor: 'action_taker', callId: resolvedCallId, reason: actionResult.error,
    });
  }

  return actionResult;
}

// -------------------------------------------------------------------
// Preparation — records intent only. Dispatch happens in
// executeApprovedAction(), which only the /approve route calls.
// -------------------------------------------------------------------

/** Resolve the order details that will eventually be templated to the chemist. */
async function resolveOrderDetails(task) {
  // Prefer the parent's real delivery address over the placeholder fallback.
  let parentAddress = 'Parent Home Address';
  if (task.parent_id) {
    const { rows } = await pool.query('SELECT address FROM users WHERE id = $1', [task.parent_id]);
    if (rows[0]?.address) parentAddress = rows[0].address;
  }

  // task.payload is populated at task creation (migrations/003). Accept the
  // camelCase shape the frontend sends as well.
  const p = task.payload || {};
  return {
    medicineName: p.medicine_name || p.medicineName || task.title || 'Prescription Medicines',
    quantity: p.quantity || task.description || '1 month supply',
    deliveryAddress: p.delivery_address || p.deliveryAddress || parentAddress,
  };
}

async function prepareMedicineOrder(task, callId, parentResponse, logCtx) {
  const order = await resolveOrderDetails(task);

  const { rows: vendors } = await pool.query(
    "SELECT phone FROM vendors WHERE parent_id = $1 AND vendor_type = 'chemist' LIMIT 1", [task.parent_id]);
  const chemistPhone = vendors[0]?.phone || null;

  await logAction({
    taskId: task.id, callId, actor: 'action_taker',
    action: 'medicine_order_prepared', result: 'pending_approval',
    payload: { ...logCtx, order, chemistPhone, parentResponse, sent: false },
  });

  return {
    success: true, needsApproval: true, actionType: 'whatsapp_medicine_order',
    order, chemistPhone, sent: false,
  };
}

async function prepareGasBooking(task, callId, logCtx) {
  await logAction({
    taskId: task.id, callId, actor: 'action_taker',
    action: 'gas_booking_prepared', result: 'pending_approval',
    payload: { ...logCtx, sent: false, note: 'Gas booking API integration pending' },
  });
  return { success: true, needsApproval: true, actionType: 'gas_booking', sent: false };
}

/**
 * Perform the action the child just approved. This is the ONLY place an
 * outbound message is sent. Called from POST /api/tasks/:id/approve.
 */
async function executeApprovedAction(task, { actor = 'parent', approvedBy = 'dashboard' } = {}) {
  if (task.task_type !== 'medicine_order') {
    return { dispatched: false, reason: `No outbound action for task_type=${task.task_type}` };
  }

  const order = await resolveOrderDetails(task);
  const { rows: vendors } = await pool.query(
    "SELECT phone FROM vendors WHERE parent_id = $1 AND vendor_type = 'chemist' LIMIT 1", [task.parent_id]);
  const chemistPhone = vendors[0]?.phone || null;

  if (!chemistPhone) {
    return { dispatched: false, reason: 'No chemist phone on file for this parent.' };
  }

  const result = await sendWhatsAppMessage(
    chemistPhone,
    [order.medicineName, order.quantity, order.deliveryAddress]
  );

  await logAction({
    taskId: task.id, actor, action: 'whatsapp_order_sent', result: 'success',
    payload: { order, chemistPhone, messageId: result?.id, deliveryStatus: result?.status, approvedBy },
  });

  return { dispatched: true, chemistPhone, messageId: result?.id, deliveryStatus: result?.status, order };
}

module.exports = { processCallOutcome, executeApprovedAction, resolveDecision };
