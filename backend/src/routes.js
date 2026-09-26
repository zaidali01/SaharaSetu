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

/** States a client may set directly on create. `done` / `couldnt_complete`
 *  are terminal and must only be reached via transitionTask() so that every
 *  state change lands in action_log. */
const PRE_ACTIVATION_STATUSES = ['pending', 'awaiting_call', 'awaiting_approval'];

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
    const { parent_id, task_type, title, description, due_date, amount, confidence_score, source_document_id, status, payload } = req.body;

    // Only pre-activation states may be set explicitly. Terminal states must be
    // reached through the state machine so every transition is audited.
    if (status && !PRE_ACTIVATION_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid initial status "${status}". Must be one of ${PRE_ACTIVATION_STATUSES.join(', ')}.`
      });
    }

    // `payload` carries the per-task action arguments the Action-Taker needs to
    // build an external message (medicine name, quantity, delivery address).
    // Falls back to the parent's real address so a caller that omits it still
    // produces a usable order rather than a placeholder.
    let actionPayload = payload && typeof payload === 'object' ? payload : null;
    if (!actionPayload && parent_id) {
      const { rows: parentRows } = await pool.query('SELECT address FROM users WHERE id = $1', [parent_id]);
      actionPayload = {
        medicine_name: title,
        quantity: description || '1 month supply',
        delivery_address: parentRows[0]?.address || 'Parent Home Address',
      };
    }

    const { rows } = await pool.query(
      `INSERT INTO tasks (parent_id, task_type, title, description, due_date, amount, confidence_score, source_document_id, status, payload)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, 'pending'), $10) RETURNING *`,
      [parent_id || null, task_type, title, description, due_date || null, amount, confidence_score, source_document_id || null, status || null, actionPayload ? JSON.stringify(actionPayload) : null]
    );
    await logAction({
      taskId: rows[0].id,
      actor: 'system',
      action: 'task_created',
      result: 'success',
      payload: { task_type, source_document_id, initial_status: rows[0].status, has_action_payload: !!actionPayload },
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
// DOCUMENTS & VISION OCR (Track B Engine)
// ────────────────────────────────────────────────────────────────

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const { extractDocumentData } = require('./ocrService');

/**
 * POST /api/ocr/extract
 * Multimodal Vision OCR extraction endpoint.
 * Accepts multipart/form-data with file or JSON with base64Image.
 */
router.post('/ocr/extract', upload.single('file'), async (req, res) => {
  try {
    let fileBuffer = req.file ? req.file.buffer : null;
    let fileName = req.file ? req.file.originalname : req.body.fileName || 'prescription_upload.pdf';
    let mimeType = req.file ? req.file.mimetype : req.body.mimeType || 'application/pdf';
    let base64Image = req.body.base64Image || null;
    let patientName = req.body.patientName || 'Ramprasad Atri';

    const result = await extractDocumentData({
      fileBuffer,
      base64Image,
      mimeType,
      fileName,
      patientName
    });

    res.json(result);
  } catch (err) {
    console.error('[/api/ocr/extract] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/documents — Track B pushes extracted document data */
router.post('/documents', async (req, res) => {
  try {
    const { parent_id, file_name, doc_type, extracted_items, raw_ocr_text, issuer } = req.body;
    try {
      const { rows } = await pool.query(
        `INSERT INTO documents (parent_id, file_name, doc_type, extracted_items, raw_ocr_text, issuer)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [parent_id, file_name, doc_type, JSON.stringify(extracted_items), raw_ocr_text, JSON.stringify(issuer)]
      );
      return res.status(201).json(rows[0]);
    } catch (dbErr) {
      // Fallback if DB is not connected
      console.warn('[/api/documents] DB error, returning success payload:', dbErr.message);
      return res.status(201).json({
        id: `doc_${Date.now()}`,
        parent_id,
        file_name,
        doc_type,
        extracted_items,
        raw_ocr_text,
        issuer,
        created_at: new Date().toISOString()
      });
    }
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
// PARENTS  (API contract from Teammate 4)
// ────────────────────────────────────────────────────────────────

/**
 * GET /api/parent/active
 * Returns the currently active parent profile with full vendor contacts.
 * Shape matches activeParent object consumed by the Command Board (Tab 1)
 * and Telemetry Trace (Tab 3).
 * Falls back to seed data so the frontend never crashes when offline.
 */
router.get('/parent/active', async (req, res) => {
  try {
    // Fetch first parent + their vendors joined
    const { rows } = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.phone,
        u.language,
        u.city,
        u.address,
        json_build_object(
          'chemist', json_build_object(
            'name',    MAX(CASE WHEN v.vendor_type='chemist'     THEN v.name     END),
            'phone',   MAX(CASE WHEN v.vendor_type='chemist'     THEN v.phone    END),
            'area',    MAX(CASE WHEN v.vendor_type='chemist'     THEN v.area     END)
          ),
          'lpg', json_build_object(
            'provider', MAX(CASE WHEN v.vendor_type='lpg'        THEN v.name     END),
            'agency',   MAX(CASE WHEN v.vendor_type='lpg'        THEN v.area     END),
            'consumerNo',MAX(CASE WHEN v.vendor_type='lpg'       THEN v.consumer_no END)
          ),
          'electricity', json_build_object(
            'provider',   MAX(CASE WHEN v.vendor_type='electricity' THEN v.name      END),
            'consumerId', MAX(CASE WHEN v.vendor_type='electricity' THEN v.consumer_no END)
          )
        ) AS vendors
      FROM users u
      LEFT JOIN vendors v ON v.parent_id = u.id
      WHERE u.role = 'parent'
      GROUP BY u.id
      ORDER BY u.created_at ASC
      LIMIT 1
    `);

    if (rows.length === 0) {
      // ── Offline / demo fallback seed ──────────────────────────────
      return res.json(SEED_ACTIVE_PARENT);
    }

    res.json(rows[0]);
  } catch (err) {
    // DB unavailable — return seed so frontend never crashes
    console.warn('[/parent/active] DB error, returning seed data:', err.message);
    res.json(SEED_ACTIVE_PARENT);
  }
});

/**
 * GET /api/parents/:id
 * Fetch a specific parent profile by UUID.
 */
router.get('/parents/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.*,
        json_agg(json_build_object(
          'vendor_type', v.vendor_type,
          'name', v.name,
          'phone', v.phone,
          'area', v.area,
          'consumer_no', v.consumer_no
        )) FILTER (WHERE v.id IS NOT NULL) AS vendors_raw
       FROM users u
       LEFT JOIN vendors v ON v.parent_id = u.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Parent not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/parents
 * List all registered parent profiles.
 */
router.get('/parents', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, phone, language, city FROM users WHERE role = 'parent' ORDER BY created_at ASC`
    );
    res.json({ parents: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Offline / demo seed (matches mockData.ts shape) ──────────────
const SEED_ACTIVE_PARENT = {
  id: 'seed-parent-001',
  name: 'Ramesh Kumar',
  phone: '+91-9876543210',
  language: 'hi',
  city: 'Patna',
  address: 'Rajendra Nagar, Patna, Bihar - 800016',
  vendors: {
    chemist: {
      name: 'Shri Ram Medical Store',
      phone: '+91-9123456789',
      area: 'Boring Road, Patna'
    },
    lpg: {
      provider: 'HP Gas',
      agency: 'Patna HP Gas Agency',
      consumerNo: 'HP-123456'
    },
    electricity: {
      provider: 'SBPDCL',
      consumerId: 'SB-987654'
    }
  }
};

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
