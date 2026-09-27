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
 *
 * The IVR runs in Hindi/Bhojpuri, so Twilio returns Devanagari transcripts.
 * Romanized-only patterns never match real transcripts, so the Devanagari set
 * below is what actually fires in production. Both are kept: the Romanized set
 * still covers English callers and the legacy dev transcript fixtures.
 */
function checkDosageChangeGuardrail(transcript = '') {
  const dosagePatterns = [
    // English
    /dose.*change/i,
    /dosage.*change/i,
    /dose.*increase/i,
    /dosage.*increase/i,
    /dose.*decrease/i,
    /dosage.*decrease/i,
    // Romanized Hindi
    /tablet.*badha/i,       // tablet increase
    /dawa.*kam karo/i,      // reduce medicine
    /dawai.*band karo/i,    // stop medicine
    // Devanagari: increase dose / tablet
    /(दवा|दवाई|दवाइय|गोली|खुराक|मात्रा|डोज|डोज़)\s*(बढ़|बढा|बढ़ा|बढ़ाओ|बढ़ाना)/i,
    // Devanagari: reduce dose / tablet
    /(दवा|दवाई|दवाइय|गोली|खुराक|मात्रा|डोज|डोज़)\s*(कम|घटा|घटाओ)/i,
    // Devanagari: stop medicine
    /(दवा|दवाई|दवाइय|गोली)\s*(बंद|बन्द|छोड़|हटा)/i,
    // Devanagari: half / double the dose
    /(आधी|दुगुनी|दो गुनी|डबल)\s*(गोली|दवा|खुराक)?/i,
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
 *
 * @param {object} opts
 * @param {string} [opts.dosageRequest] — the Voice Agent's own classification
 *   for the medicine answer ('dosage_request'). This is authoritative: regex
 *   matching on a transcript is a backstop, not the primary signal, because the
 *   agent already understands the intent in-context.
 */
async function runGuardrails({ taskId, type, transcript, amount, isApproved, dosageRequest }) {
  // 1. Dosage change check. The explicit classification wins; the transcript
  //    regex is the fallback for callers that don't send `responses`.
  if (type === 'medicine_order') {
    const classified = dosageRequest === 'dosage_request';
    const matched = !classified && transcript && checkDosageChangeGuardrail(transcript);
    if (classified || matched) {
      await logAction({
        taskId,
        actor: 'guardrail',
        action: 'dosage_change_blocked',
        result: 'blocked',
        payload: {
          detected_by: classified ? 'voice_agent_classification' : 'transcript_regex',
          transcript: transcript?.slice(0, 200),
        },
      });
      return {
        allowed: false,
        reason: 'Dosage change requested on the call — order withheld and flagged for the child. A clinician must review; the agent never alters dosage.',
      };
    }
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
