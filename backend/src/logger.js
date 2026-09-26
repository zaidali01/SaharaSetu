/**
 * Task 3.7 — Action Logger
 * Every automated step must be logged here with full context.
 */
const { pool } = require('./db');

/**
 * Append an immutable entry to the action_log table.
 * @param {object} opts
 * @param {string} opts.taskId
 * @param {string|null} opts.callId
 * @param {string} opts.actor  — 'planner' | 'voice_agent' | 'action_taker' | 'parent' | 'guardrail'
 * @param {string} opts.action — e.g. 'call_initiated', 'payment_blocked'
 * @param {string} opts.result — e.g. 'success', 'blocked', 'failed_no_answer'
 * @param {object} [opts.payload] — arbitrary JSON context
 */
async function logAction({ taskId, callId = null, actor, action, result, payload = {} }) {
  try {
    await pool.query(
      `INSERT INTO action_log (task_id, call_id, actor, action, result, payload)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [taskId, callId, actor, action, result, JSON.stringify(payload)]
    );
    console.log(`[LOG] ${actor} → ${action} → ${result}`, payload);
  } catch (err) {
    // Logging must never crash the main flow
    console.error('[LOG ERROR]', err.message);
  }
}

module.exports = { logAction };
