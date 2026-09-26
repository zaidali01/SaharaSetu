/**
 * Task 3.3 — Planner Agent
 * Scans pending tasks and decides what needs a call and when.
 * Runs on a schedule (called from server.js setInterval or a cron).
 */
const { pool } = require('../db');
const { transitionTask } = require('./stateMachine');
const { logAction } = require('./logger');

const MAX_CALL_RETRIES = parseInt(process.env.MAX_CALL_RETRIES || '2');

/**
 * Run the Planner: fetch all pending tasks that are due and trigger them.
 * In a real system this would invoke the Voice Agent (Track A).
 * For now it moves tasks to 'awaiting_call' and logs a mock call trigger.
 */
async function runPlanner() {
  console.log('[PLANNER] Running planner cycle...');

  // Fetch tasks that are pending and due (or overdue)
  const { rows: pendingTasks } = await pool.query(`
    SELECT t.*, u.phone AS parent_phone, u.name AS parent_name, u.language
    FROM tasks t
    JOIN users u ON t.parent_id = u.id
    WHERE t.status = 'pending'
      AND (t.due_date IS NULL OR t.due_date <= NOW() + INTERVAL '1 hour')
    ORDER BY t.due_date ASC NULLS LAST
    LIMIT 20
  `);

  if (pendingTasks.length === 0) {
    console.log('[PLANNER] No tasks due. Sleeping.');
    return;
  }

  console.log(`[PLANNER] Found ${pendingTasks.length} task(s) to process.`);

  for (const task of pendingTasks) {
    // Transition: pending → awaiting_call
    const result = await transitionTask(task.id, 'awaiting_call', {
      actor: 'planner',
      reason: 'Due date reached; initiating call',
      payload: { parent_phone: task.parent_phone, task_type: task.task_type },
    });

    if (result.success) {
      // 2.3i: Call the Voice Agent (Track A) API
      try {
        const response = await fetch('http://localhost:3000/api/trigger-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: task.id, phone: task.parent_phone }),
        });
        const triggerData = await response.json();
        
        console.log(`[PLANNER] ✓ Task ${task.id} (${task.task_type}) → awaiting_call for ${task.parent_name}. Call SID: ${triggerData.callSid}`);

        await logAction({
          taskId: task.id,
          actor: 'planner',
          action: 'call_trigger_sent',
          result: 'success',
          payload: {
            parent_phone: task.parent_phone,
            language: task.language,
            task_type: task.task_type,
            callSid: triggerData.callSid,
            note: 'Voice Agent triggered successfully via HTTP API',
          },
        });
      } catch (err) {
        console.error(`[PLANNER] Failed to trigger Voice Agent for Task ${task.id}:`, err.message);
      }
    }
  }
}

/**
 * Handle a no-answer event from the Voice Agent.
 * After MAX_CALL_RETRIES, escalate the task to 'couldnt_complete'.
 */
async function handleNoAnswer(taskId, callId, currentRetryCount) {
  if (currentRetryCount >= MAX_CALL_RETRIES) {
    await transitionTask(taskId, 'couldnt_complete', {
      actor: 'planner',
      callId,
      reason: `No answer after ${MAX_CALL_RETRIES} attempts.`,
    });
    await logAction({
      taskId,
      callId,
      actor: 'planner',
      action: 'escalated_no_answer',
      result: 'couldnt_complete',
      payload: { retries: currentRetryCount },
    });
  } else {
    // Retry: keep status as awaiting_call; Voice Agent will retry
    await logAction({
      taskId,
      callId,
      actor: 'planner',
      action: 'call_retry_scheduled',
      result: 'pending_retry',
      payload: { retryNumber: currentRetryCount + 1, maxRetries: MAX_CALL_RETRIES },
    });
    console.log(`[PLANNER] Task ${taskId}: retry ${currentRetryCount + 1}/${MAX_CALL_RETRIES} scheduled.`);
  }
}

module.exports = { runPlanner, handleNoAnswer };
