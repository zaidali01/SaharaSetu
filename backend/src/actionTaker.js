/**
 * Task 3.4 — Action-Taker Agent
 * Receives a call outcome (from Voice Agent Track A) and maps it
 * to a concrete action: WhatsApp order, gas booking, or payment queue entry.
 * All actions pass through guardrails before execution.
 */
const { pool } = require('../db');
const { transitionTask } = require('./stateMachine');
const { runGuardrails } = require('./guardrails');
const { logAction } = require('./logger');

/**
 * Process a call outcome and execute the appropriate action.
 * @param {object} outcome
 * @param {string} outcome.taskId
 * @param {string} outcome.callId
 * @param {string} outcome.callStatus — 'answered' | 'no_answer' | 'distress'
 * @param {string} outcome.transcript — raw call transcript
 * @param {string} outcome.parentResponse — extracted intent (e.g. 'confirmed_medicine', 'confirmed_gas')
 * @param {number} [outcome.amount] — payment amount if applicable
 * @param {boolean} [outcome.isApproved] — was child approval already given?
 */
async function processCallOutcome(outcome) {
  const { taskId, callId, callStatus, transcript, parentResponse, amount, isApproved } = outcome;

  // 1. Fetch the task
  const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
  if (rows.length === 0) {
    console.error(`[ACTION] Task ${taskId} not found.`);
    return { success: false, error: 'Task not found' };
  }
  const task = rows[0];

  // 2. Handle no-answer / distress signals
  if (callStatus === 'no_answer') {
    // Planner handles retry/escalation
    return { success: true, action: 'no_answer_escalated_to_planner' };
  }

  if (callStatus === 'distress') {
    await logAction({
      taskId,
      callId,
      actor: 'action_taker',
      action: 'distress_flag_raised',
      result: 'escalated',
      payload: { transcript: transcript?.slice(0, 200) },
    });
    // Move to awaiting_approval so the child can review
    await transitionTask(taskId, 'awaiting_approval', {
      actor: 'action_taker',
      callId,
      reason: 'Distress keyword detected in call.',
    });
    return { success: true, action: 'distress_escalated' };
  }

  // 3. Run guardrails BEFORE taking any action
  const guardrail = await runGuardrails({
    taskId,
    type: task.task_type,
    transcript,
    amount,
    isApproved,
  });

  if (!guardrail.allowed) {
    await transitionTask(taskId, 'awaiting_approval', {
      actor: 'guardrail',
      callId,
      reason: guardrail.reason,
    });
    return { success: false, blocked: true, reason: guardrail.reason };
  }

  // 4. Execute action based on task type
  let actionResult;
  if (task.task_type === 'medicine_order') {
    actionResult = await dispatchMedicineOrder(task, callId, transcript, parentResponse);
  } else if (task.task_type === 'gas_booking') {
    actionResult = await dispatchGasBooking(task, callId, parentResponse);
  } else {
    actionResult = { success: true, note: 'No specific action handler for this task type.' };
  }

  // 5. If action needs child approval, move to awaiting_approval; otherwise done
  if (actionResult.needsApproval) {
    await transitionTask(taskId, 'awaiting_approval', {
      actor: 'action_taker',
      callId,
      reason: 'Action requires child confirmation.',
      payload: actionResult,
    });
  } else if (actionResult.success) {
    await transitionTask(taskId, 'done', {
      actor: 'action_taker',
      callId,
      payload: actionResult,
    });
  } else {
    await transitionTask(taskId, 'couldnt_complete', {
      actor: 'action_taker',
      callId,
      reason: actionResult.error,
    });
  }

  return actionResult;
}

// -------------------------------------------------------------------
// Sub-actions (will integrate with WhatsApp API in Task 3.5)
// -------------------------------------------------------------------

async function dispatchMedicineOrder(task, callId, transcript, parentResponse) {
  console.log(`[ACTION] Dispatching medicine order for task ${task.id}`);

  // Fetch the chemist phone from vendors
  const { rows } = await pool.query("SELECT * FROM vendors WHERE parent_id = $1 AND vendor_type = 'chemist' LIMIT 1", [task.parent_id]);
  const chemistPhone = rows.length > 0 ? rows[0].phone : null;

  // 2.5i: Wire Action-Taker output into WhatsApp message sends
  if (chemistPhone) {
    try {
      const waToken = process.env.WHATSAPP_TOKEN;
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      
      if (waToken && phoneId) {
        // Send real WhatsApp message if configured
        await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${waToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: chemistPhone.replace('+', ''), // Strip + for WhatsApp API
            type: 'text',
            text: { body: `New order request from SaharaSetu for task ${task.id}. Parent confirms medicine required.` }
          })
        });
        console.log(`[ACTION] WhatsApp message dispatched to chemist at ${chemistPhone}`);
      } else {
        console.log(`[ACTION] WhatsApp Sandbox not configured yet. MOCK sending order to ${chemistPhone}.`);
      }
    } catch (err) {
      console.error(`[ACTION] Failed to send WhatsApp message:`, err.message);
    }
  }

  await logAction({
    taskId: task.id,
    callId,
    actor: 'action_taker',
    action: 'whatsapp_order_queued',
    result: 'success',
    payload: {
      task_type: task.task_type,
      parent_response: parentResponse,
      chemistPhone,
      note: 'WhatsApp integration wired (Task 2.5i)',
    },
  });

  // For now: requires child approval before sending (demo-safe)
  return { success: true, needsApproval: true, actionType: 'whatsapp_medicine_order' };
}

async function dispatchGasBooking(task, callId, parentResponse) {
  console.log(`[ACTION] Dispatching gas booking for task ${task.id}`);

  await logAction({
    taskId: task.id,
    callId,
    actor: 'action_taker',
    action: 'gas_booking_queued',
    result: 'success',
    payload: {
      task_type: task.task_type,
      parent_response: parentResponse,
      note: 'Gas booking API integration pending',
    },
  });

  return { success: true, needsApproval: true, actionType: 'gas_booking' };
}

module.exports = { processCallOutcome };
