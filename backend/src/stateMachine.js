/**
 * Task 3.2 — Task State Machine
 * Valid transitions: pending → awaiting_call → awaiting_approval → done / couldnt_complete
 * Any attempt to skip states or go backwards is rejected.
 */
const { pool } = require('../db');
const { logAction } = require('./logger');

const VALID_TRANSITIONS = {
  pending:            ['awaiting_call'],
  awaiting_call:      ['awaiting_approval', 'couldnt_complete'],
  awaiting_approval:  ['done', 'couldnt_complete'],
  done:               [],      // terminal
  couldnt_complete:   [],      // terminal
};

/**
 * Transition a task to a new status.
 * @param {string} taskId
 * @param {string} newStatus
 * @param {object} context — { actor, callId, reason, payload }
 * @returns {Promise<{success: boolean, task?: object, error?: string}>}
 */
async function transitionTask(taskId, newStatus, { actor, callId = null, reason = '', payload = {} } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch current status (with row-level lock)
    const { rows } = await client.query(
      'SELECT id, status, task_type, amount FROM tasks WHERE id = $1 FOR UPDATE',
      [taskId]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: `Task ${taskId} not found.` };
    }

    const task = rows[0];
    const allowed = VALID_TRANSITIONS[task.status] || [];

    // 2. Validate transition
    if (!allowed.includes(newStatus)) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: `Invalid transition: ${task.status} → ${newStatus}. Allowed: [${allowed.join(', ')}]`,
      };
    }

    // 3. Apply transition
    const { rows: updated } = await client.query(
      'UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [newStatus, taskId]
    );

    await client.query('COMMIT');

    // 4. Log the transition
    await logAction({
      taskId,
      callId,
      actor,
      action: `status_transition:${task.status}→${newStatus}`,
      result: 'success',
      payload: { from: task.status, to: newStatus, reason, ...payload },
    });

    console.log(`[STATE] Task ${taskId}: ${task.status} → ${newStatus}`);
    return { success: true, task: updated[0] };

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[STATE ERROR]', err.message);
    return { success: false, error: err.message };
  } finally {
    client.release();
  }
}

/**
 * Get a task by ID with its full action log.
 */
async function getTaskWithLog(taskId) {
  const { rows: tasks } = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
  if (tasks.length === 0) return null;
  const { rows: logs } = await pool.query(
    'SELECT * FROM action_log WHERE task_id = $1 ORDER BY timestamp ASC',
    [taskId]
  );
  return { ...tasks[0], action_log: logs };
}

module.exports = { transitionTask, getTaskWithLog, VALID_TRANSITIONS };
