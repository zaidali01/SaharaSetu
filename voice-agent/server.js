// Voice agent webhook server — Phase 1 Track A, all tasks.
//
// IMPORTANT: run `node pregenerate_audio.js` BEFORE starting this server,
// and again any time CHILD_NAME/CHEMIST_NAME/DAYS_LEFT change in .env.
// This server plays pre-made audio files — it does NOT call Sarvam live
// during a call, because that blew past Twilio's 5-second TwiML fetch
// timeout and silently killed calls after the trial disclaimer.

require('dotenv').config();
require('dns').setDefaultResultOrder('ipv4first');
const express = require('express');
const fs = require('fs');
const path = require('path');
const twilio = require('twilio');
const { matchMedicineResponse, matchGasResponse } = require('./matcher');
const { escalate } = require('./escalate');
const { placeCall } = require('./place_call');
const { checkDosageChange } = require('./guardrails');


const BACKEND_OUTCOME_URL = process.env.BACKEND_OUTCOME_URL || 'http://localhost:4000/api/calls/outcome';

// Task 2.4i — reports ONE outcome per call, after it ends.
// callId is null on purpose: action_log.call_id is a UUID FK to calls(id),
// so a Twilio SID there makes every audit-log insert fail silently.
async function reportOutcome(callSid, session, callStatus) {
  if (!session || !session.taskId) {
    console.log('[BACKEND-SYNC] No taskId (manual CLI call) — not reporting.');
    return;
  }
  if (session.reported) return;
  session.reported = true;

  const payload = {
    taskId: session.taskId,
    callId: null,
    callSid,
    callStatus, // 'answered' | 'no_answer' | 'distress'
    parentResponse: `medicine:${session.medicine},gas:${session.gas}`,
    responses: { medicine: session.medicine, gas: session.gas },
    transcript: session.transcript.join(' | '),
  };
  console.log('[BACKEND-SYNC] Reporting:', JSON.stringify(payload));

  try {
    const res = await fetch(BACKEND_OUTCOME_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log(`[BACKEND-SYNC] ${res.status}: ${await res.text()}`);
  } catch (err) {
    console.error('[BACKEND-SYNC] Failed to report outcome:', err.message);
  }
}

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/audio', express.static(path.join(__dirname, 'public', 'audio')));

const PORT = process.env.PORT || 3000;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL;
const CHILD_NAME = process.env.CHILD_NAME || 'aapke bete';
const RETRY_DELAY_MS = 15000;

// Per-call state, keyed by Twilio CallSid (sent on every webhook, including
// /call-status). Carries taskId + both answers across the whole call without
// threading taskId through every Gather action URL.
// In-memory only: lost if server.js restarts mid-call (same limitation as retry count).
const sessions = new Map();

function getSession(callSid) {
  if (!sessions.has(callSid)) {
    sessions.set(callSid, { taskId: null, medicine: null, gas: null, transcript: [], reported: false });
  }
  return sessions.get(callSid);
}
function requirePublicUrl() {
  if (!PUBLIC_BASE_URL) {
    throw new Error('PUBLIC_BASE_URL is not set in .env. Run ngrok and set it to the https URL it gives you.');
  }
}

// Plays a pre-generated file. Falls back to robotic <Say> only if the file
// is genuinely missing (e.g. you forgot to run pregenerate_audio.js) —
// this fallback text must be passed in since we no longer call Sarvam here.
function playStatic(twiml, filename, fallbackText) {
  const filePath = path.join(__dirname, 'public', 'audio', filename);
  if (fs.existsSync(filePath)) {
    twiml.play(`${PUBLIC_BASE_URL}/audio/${filename}`);
  } else {
    console.error(`Missing audio file: ${filename} — did you run pregenerate_audio.js? Falling back to robotic Say.`);
    twiml.say({ language: 'hi-IN' }, fallbackText);
  }
}

app.post('/voice', (req, res) => {
  requirePublicUrl();
  const session = getSession(req.body.CallSid);
  if (req.query.taskId) session.taskId = req.query.taskId;
  console.log(`[SESSION] ${req.body.CallSid} — taskId: ${session.taskId || '(none, manual CLI call)'}`);
  const twiml = new twilio.twiml.VoiceResponse();

  playStatic(twiml, 'greeting.wav', `Namaste! Main ${CHILD_NAME} ki taraf se baat kar raha hoon.`);

  const gather = twiml.gather({
    input: 'speech dtmf',
    numDigits: 1,
    language: 'hi-IN',
    speechTimeout: 'auto',
    action: '/handle-medicine?attempt=1',
    method: 'POST',
  });
  playStatic(gather, 'medicine_question.wav', 'Kya main dawai ka order bhej doon?');

  twiml.say({ language: 'hi-IN' }, 'Mujhe kuch nahi mila. Phir se koshish karte hain.');
  // Silence → reuse the unclear/DTMF path instead of replaying the greeting forever.
  twiml.redirect('/handle-medicine?attempt=1');

  res.type('text/xml').send(twiml.toString());
});

app.post('/handle-medicine', async (req, res) => {
  requirePublicUrl();
  const attempt = parseInt(req.query.attempt || '1', 10);
  const speechText = req.body.SpeechResult || '';
  const digit = req.body.Digits || '';
  let result = matchMedicineResponse(speechText, digit);
  // Guardrail 3.2t: a dosage-change request must never count as "yes".
  // Distress still wins; a keypad press skips this check.
  if (result !== 'distress' && !digit && checkDosageChange(speechText)) {
    result = 'dosage_request';
  }

  console.log(`MEDICINE_CHECK (attempt ${attempt}) — heard: "${speechText}" | digit: "${digit}" | matched: ${result}`);
  const session = getSession(req.body.CallSid);
  session.medicine = result;
  if (speechText) session.transcript.push(`MEDICINE: ${speechText}`);
  if (digit) session.transcript.push(`MEDICINE_DTMF: ${digit}`);
  const twiml = new twilio.twiml.VoiceResponse();

  if (result === 'distress') {
    await escalate({ type: 'distress', state: 'MEDICINE_CHECK', transcript: speechText });
    playStatic(twiml, 'distress_ack.wav', 'Theek hai, main bata deta hoon.');
    twiml.hangup();
    return res.type('text/xml').send(twiml.toString());
  }

  if (result === 'dosage_request') {
    await escalate({ type: 'dosage_change_request', state: 'MEDICINE_CHECK', transcript: speechText });
    playStatic(twiml, 'dosage_refusal.wav', 'Maaf kijiye, main dawai ki khuraak nahi badal sakta.');
    const gather = twiml.gather({
      input: 'speech dtmf',
      numDigits: 1,
      language: 'hi-IN',
      speechTimeout: 'auto',
      action: '/handle-gas?attempt=1',
      method: 'POST',
    });
    playStatic(gather, 'gas_question.wav', 'Gas cylinder ka kya haal hai?');
    twiml.redirect('/handle-gas?attempt=1');
    return res.type('text/xml').send(twiml.toString());
  }
  

  if (result === 'unclear' && attempt < 2) {
    const gather = twiml.gather({
      input: 'speech dtmf',
      numDigits: 1,
      language: 'hi-IN',
      speechTimeout: 'auto',
      action: '/handle-medicine?attempt=2',
      method: 'POST',
    });
    playStatic(gather, 'medicine_retry.wav', 'Haan ke liye ek dabayein, na ke liye do dabayein.');
    // Silence on the keypad retry → finalize medicine as unclear, which then ASKS the gas question.
    twiml.redirect('/handle-medicine?attempt=2');
    return res.type('text/xml').send(twiml.toString());
  }

  if (result === 'yes') {
    console.log('ACTION: trigger WhatsApp order to chemist — task_status: awaiting_approval');
  } else if (result === 'no') {
    console.log('ACTION: mark medicine task as deferred');
  } else {
    console.log('Still unclear after retry — marking medicine task for manual follow-up.');
  }

  const gather = twiml.gather({
    input: 'speech dtmf',
    numDigits: 1,
    language: 'hi-IN',
    speechTimeout: 'auto',
    action: '/handle-gas?attempt=1',
    method: 'POST',
  });
  playStatic(gather, 'gas_question.wav', 'Gas cylinder ka kya haal hai?');
  twiml.redirect('/handle-gas?attempt=1');

  res.type('text/xml').send(twiml.toString());
});

app.post('/handle-gas', async (req, res) => {
  requirePublicUrl();
  const attempt = parseInt(req.query.attempt || '1', 10);
  const speechText = req.body.SpeechResult || '';
  const digit = req.body.Digits || '';
  const result = matchGasResponse(speechText, digit);

  console.log(`GAS_BOOKING_CHECK (attempt ${attempt}) — heard: "${speechText}" | digit: "${digit}" | matched: ${result}`);
  const session = getSession(req.body.CallSid);
  session.gas = result;
  if (speechText) session.transcript.push(`GAS: ${speechText}`);
  if (digit) session.transcript.push(`GAS_DTMF: ${digit}`);
  const twiml = new twilio.twiml.VoiceResponse();

  if (result === 'distress') {
    await escalate({ type: 'distress', state: 'GAS_BOOKING_CHECK', transcript: speechText });
    playStatic(twiml, 'distress_ack2.wav', 'Theek hai, main bata deta hoon.');
    twiml.hangup();
    return res.type('text/xml').send(twiml.toString());
  }

  if (result === 'unclear' && attempt < 2) {
    const gather = twiml.gather({
      input: 'speech dtmf',
      numDigits: 1,
      language: 'hi-IN',
      speechTimeout: 'auto',
      action: '/handle-gas?attempt=2',
      method: 'POST',
    });
    playStatic(gather, 'gas_retry.wav', 'Kam hai to ek dabayein, theek hai to do dabayein.');
    twiml.redirect('/handle-gas?attempt=2');
    return res.type('text/xml').send(twiml.toString());
  }

  if (result === 'low') {
    console.log('ACTION: draft gas booking — task_status: awaiting_approval');
  } else if (result === 'fine') {
    console.log('ACTION: mark gas task as done, no action needed');
  } else {
    console.log('Still unclear after retry — marking gas task for manual follow-up.');
  }

  playStatic(twiml, 'closing.wav', `Theek hai, main ${CHILD_NAME} ko bata dunga. Namaste.`);
  twiml.hangup();

  res.type('text/xml').send(twiml.toString());
});

app.post('/call-status', async (req, res) => {
  const attempt = parseInt(req.query.attempt || '1', 10);
  const status = req.body.CallStatus;

  console.log(`Call status callback — attempt ${attempt}: ${status}`);
  console.log('[SESSION END]', req.body.CallSid, JSON.stringify(sessions.get(req.body.CallSid) || null));
  const callSid = req.body.CallSid;
  const taskId = req.query.taskId || null;
  // 'completed' but /voice never ran = parent hung up during the trial
  // disclaimer / before the agent spoke. Treat as unanswered.
  const neverReachedAgent = status === 'completed' && !sessions.has(callSid);

  if (status === 'completed') {
    const session = sessions.get(callSid);
    if (session) {
      const distress = session.medicine === 'distress' || session.gas === 'distress';
      await reportOutcome(callSid, session, distress ? 'distress' : 'answered');
    }
  }

  if (neverReachedAgent || ['no-answer', 'busy', 'failed'].includes(status)) {    if (attempt < 2) {
      console.log(`No answer on attempt ${attempt}. Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      setTimeout(() => {
        // Keep the same number and task on retry — previously both were dropped.
        placeCall(attempt + 1, req.body.To, taskId).catch((err) => console.error('Retry call failed:', err.message));
      }, RETRY_DELAY_MS);
    } else {
      console.log('Second attempt also unanswered — escalating missed-call alert.');
      await escalate({ type: 'missed_call', detail: `No answer after ${attempt} attempts`, lastStatus: status });
      const session = getSession(callSid);
      session.taskId = taskId;
      await reportOutcome(callSid, session, 'no_answer');
    }
  }

  res.sendStatus(200);
});


app.post("/api/trigger-call", async (req, res) => {
  try {
    const { taskId, phone } = req.body;
    const call = await placeCall(1, phone, taskId);
    res.json({ success: true, callSid: call.sid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Voice agent server listening on port ${PORT}`);
  console.log('Have you run `node pregenerate_audio.js` yet? If not, do that first.');
  console.log('Remember: run ngrok and set PUBLIC_BASE_URL in .env before triggering a call.');
});
