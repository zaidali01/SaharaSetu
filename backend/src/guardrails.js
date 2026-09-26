/**
 * Task 3.6 — Guardrails Middleware
 * Blocks unsafe actions BEFORE any external call is made.
 * Every block is logged to the action_log table.
 */
const { logAction } = require('./logger');

const MAX_PAYMENT_AMOUNT = parseFloat(process.env.MAX_PAYMENT_AMOUNT || '500');

/**
 * Guardrail: Block dosage-change responses from voice calls.
 * If a call transcript contains a dosage modification request, BLOCK it.
 */
function checkDosageChangeGuardrail(transcript = '') {
  const dosagePatterns = [
    /dose.*change/i,
    /dosage.*increase/i,
    /dosage.*decrease/i,
    /tablet.*badha/i,       // Hindi: tablet increase
    /dawa.*kam karo/i,      // Hindi: reduce medicine
    /dawai.*band karo/i,    // Hindi: stop medicine
  ];
  return dosagePatterns.some((pattern) => pattern.test(transcript));
}

/**
 * Guardrail: Block any unapproved payment above a threshold or without explicit child approval.
 */
function checkPaymentGuardrail(amount, isApproved) {
  if (!isApproved) return { blocked: true, reason: 'Payment not explicitly approved by child.' };
  if (amount > MAX_PAYMENT_AMOUNT) {
    return { blocked: true, reason: `Amount ₹${amount} exceeds max allowed ₹${MAX_PAYMENT_AMOUNT}.` };
  }
  return { blocked: false };
}

/**
 * Main guardrail check — call this before executing any action.
 * Returns { allowed: boolean, reason: string }
 */
async function runGuardrails({ taskId, type, transcript, amount, isApproved }) {
  // 1. Dosage change check
  if (type === 'medicine_order' && transcript && checkDosageChangeGuardrail(transcript)) {
    await logAction({
      taskId,
      actor: 'guardrail',
      action: 'dosage_change_blocked',
      result: 'blocked',
      payload: { transcript: transcript.slice(0, 200) },
    });
    return { allowed: false, reason: 'Dosage change detected in call — action blocked for safety.' };
  }

  // 2. Payment check
  if (amount !== undefined) {
    const paymentCheck = checkPaymentGuardrail(amount, isApproved);
    if (paymentCheck.blocked) {
      await logAction({
        taskId,
        actor: 'guardrail',
        action: 'payment_blocked',
        result: 'blocked',
        payload: { amount, isApproved, reason: paymentCheck.reason },
      });
      return { allowed: false, reason: paymentCheck.reason };
    }
  }

  return { allowed: true, reason: null };
}

module.exports = { runGuardrails, checkDosageChangeGuardrail, checkPaymentGuardrail };
