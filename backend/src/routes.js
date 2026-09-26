/**
 * REST API Routes for SaharaSetu Backend
 * Exposes endpoints for the Dashboard (Track D) and Voice Agent (Track A)
 */
const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { transitionTask, getTaskWithLog } = require('./stateMachine');
const { processCallOutcome } = require('./actionTaker');
const { logAction } = require('./logger');

// ────────────────────────────────────────────────────────────────
// TASKS
// ────────────────────────────────────────────────────────────────

/** GET /api/tasks — list all tasks (with optional status filter) */
router.get('/tasks', async (req, res) => {
  try {
    const { status, parent_id } = req.query;
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    if (parent_id) { params.push(parent_id); query += ` AND parent_id = $${params.length}`; }
    query += ' ORDER BY due_date ASC NULLS LAST';
    const { rows } = await pool.query(query, params);
    res.json({ tasks: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/tasks/:id — get a task with full action log */
router.get('/tasks/:id', async (req, res) => {
  try {
    const task = await getTaskWithLog(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/tasks — create a new task */
router.post('/tasks', async (req, res) => {
  try {
    const { parent_id, task_type, title, description, due_date, amount, confidence_score, source_document_id } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO tasks (parent_id, task_type, title, description, due_date, amount, confidence_score, source_document_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [parent_id, task_type, title, description, due_date, amount, confidence_score, source_document_id]
    );
    await logAction({
      taskId: rows[0].id,
      actor: 'system',
      action: 'task_created',
      result: 'success',
      payload: { task_type, source_document_id },
    });
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/tasks/:id/approve — child approves a task (Needs Approval → Done) */
router.post('/tasks/:id/approve', async (req, res) => {
  try {
    const result = await transitionTask(req.params.id, 'done', {
      actor: 'parent',  // in this context "parent" = child user (naming from PRD)
      reason: 'Manually approved via dashboard',
      payload: { approved_by: req.body.approved_by || 'dashboard' },
    });
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json(result.task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/tasks/:id/reject — child rejects a task → couldnt_complete */
router.post('/tasks/:id/reject', async (req, res) => {
  try {
    const result = await transitionTask(req.params.id, 'couldnt_complete', {
      actor: 'parent',
      reason: req.body.reason || 'Rejected via dashboard',
    });
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json(result.task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────────
// CALL OUTCOMES (called by Voice Agent — Track A)
// ────────────────────────────────────────────────────────────────

/** POST /api/calls/outcome — Voice Agent reports back a call result */
router.post('/calls/outcome', async (req, res) => {
  try {
    const result = await processCallOutcome(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────────
// ACTION LOG
// ────────────────────────────────────────────────────────────────

/** GET /api/logs — get recent action logs (for agent trace view) */
router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50');
    const { rows } = await pool.query(
      'SELECT * FROM action_log ORDER BY timestamp DESC LIMIT $1',
      [limit]
    );
    res.json({ logs: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────────
// DOCUMENTS (receive OCR output from Track B)
// ────────────────────────────────────────────────────────────────

/** POST /api/documents — Track B pushes extracted document data */
router.post('/documents', async (req, res) => {
  try {
    const { parent_id, file_name, doc_type, extracted_items, raw_ocr_text, issuer } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO documents (parent_id, file_name, doc_type, extracted_items, raw_ocr_text, issuer)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [parent_id, file_name, doc_type, JSON.stringify(extracted_items), raw_ocr_text, JSON.stringify(issuer)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/documents/:id — fetch a document with extracted items */
router.get('/documents/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ────────────────────────────────────────────────────────────────

router.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

module.exports = router;
