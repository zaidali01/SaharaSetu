/**
 * SaharaSetu — Backend Server Entry Point
 * Track C: Backend / Orchestration + Guardrails (Person 3)
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./src/routes');
const { runPlanner } = require('./src/planner');

// ─── WhatsApp Webhook (Task 0.6 — deferred until real fallback is built)
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'sahara_setu_secret_token_123';

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── API Routes
app.use('/api', routes);

// ─── WhatsApp Webhook Verification (deferred — will wire in when real fallback ready)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WEBHOOK] Verified by Meta');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

app.post('/webhook', (req, res) => {
  console.log('[WEBHOOK] Incoming:', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

// ─── Start Server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║     SaharaSetu Backend — Track C           ║
║     Running on http://localhost:${PORT}       ║
╚════════════════════════════════════════════╝
  `);
  console.log('API Endpoints:');
  console.log('  GET  /api/health');
  console.log('  GET  /api/tasks');
  console.log('  POST /api/tasks');
  console.log('  POST /api/tasks/:id/approve');
  console.log('  POST /api/tasks/:id/reject');
  console.log('  POST /api/calls/outcome');
  console.log('  GET  /api/logs');
  console.log('  POST /api/documents');

  // ─── Start Planner (every 5 minutes)
  const PLANNER_INTERVAL_MS = 5 * 60 * 1000;
  runPlanner().catch(err => console.warn('[PLANNER] DB offline (will retry on next interval):', err.message));
  setInterval(() => {
    runPlanner().catch(err => console.warn('[PLANNER] DB offline:', err.message));
  }, PLANNER_INTERVAL_MS);
  console.log(`\n[PLANNER] Scheduling every ${PLANNER_INTERVAL_MS / 60000} minutes.`);
});
