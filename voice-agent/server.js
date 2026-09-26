// Voice agent webhook server — all of Phase 1 Track A:
// 1.2 STT (Twilio Gather), 1.3 TTS (Sarvam), 1.4 state machine,
// 1.5 DTMF fallback, 1.6 no-answer retry, 1.7 distress escalation.
//
// Requires a public URL. Run: ngrok http 3000, then set PUBLIC_BASE_URL in .env.

require('dotenv').config();
const express = require('express');
const path = require('path');
const twilio = require('twilio');
const { generateSpeech } = require('./tts');
const { matchMedicineResponse, matchGasResponse } = require('./matcher');
const { escalate } = require('./escalate');
const { placeCall } = require('./place_call');


async function reportOutcome(taskId, callStatus, transcript, parentResponse) {
  if (!taskId) return;
  try {
    const res = await fetch("http://localhost:4000/api/calls/outcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId,
        callId: "twilio-" + Date.now(),
        callStatus,
        transcript,
        parentResponse,
      })
    });
    console.log("[BACKEND-SYNC] Outcome reported, status:", res.status);
  } catch (err) {
    console.error("[BACKEND-SYNC] Failed to report outcome:", err.message);
  }
}

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/audio', express.static(path.join(__dirname, 'public', 'audio')));

const PORT = process.env.PORT || 3000;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL;
const CHILD_NAME = process.env.CHILD_NAME || 'aapke bete';
const CHEMIST_NAME = process.env.CHEMIST_NAME || 'chemist';
const DAYS_LEFT = process.env.DAYS_LEFT || '4';
const RETRY_DELAY_MS = 15000; // wait before re-dialing on no-answer — not specified in the original plan, chosen as a reasonable default; change if it doesn't fit your demo timing

function requirePublicUrl() {
  if (!PUBLIC_BASE_URL) {
    throw new Error('PUBLIC_BASE_URL is not set in .env. Run ngrok and set it to the https URL it gives you.');
  }
}

async function playOrSay(twiml, text, filename) {
  try {
    const audioPath = await generateSpeech(text, filename);
    twiml.play(`${PUBLIC_BASE_URL}${audioPath}`);
  } catch (err) {
    console.error('TTS failed, falling back to robotic Say:', err.message);
    twiml.say({ language: 'hi-IN' }, text);
  }
}

// ---- 1.4 / 1.2 / 1.3 — call entry point ----
app.post('/voice', async (req, res) => {
  requirePublicUrl();
  const twiml = new twilio.twiml.VoiceResponse();

  const greeting = `Namaste! Main ${CHILD_NAME} ki taraf se baat kar raha hoon. Aapse do minute baat karni hai.`;
  await playOrSay(twiml, greeting, 'greeting.wav');

  const medicineQuestion = `Aapki BP ki dawai ab sirf ${DAYS_LEFT} din ki bachi hai. Kya main ${CHEMIST_NAME} ko order bhej doon?`;
  const gather = twiml.gather({
    input: 'speech dtmf',
    numDigits: 1,
    language: 'hi-IN',
    speechTimeout: 'auto',
    action: '/handle-medicine?attempt=1',
    method: 'POST',
  });
  await playOrSay(gather, medicineQuestion, 'medicine_question.wav');

  twiml.say({ language: 'hi-IN' }, 'Mujhe kuch nahi mila. Phir se koshish karte hain.');
  twiml.redirect('/voice');

  res.type('text/xml').send(twiml.toString());
});

// ---- MEDICINE_CHECK, with 1.5 DTMF retry ----
app.post('/handle-medicine', async (req, res) => {
  requirePublicUrl();
  const attempt = parseInt(req.query.attempt || '1', 10);
  const speechText = req.body.SpeechResult || '';
  const digit = req.body.Digits || '';
  const result = matchMedicineResponse(speechText, digit);

  console.log(`MEDICINE_CHECK (attempt ${attempt}) — heard: "${speechText}" | digit: "${digit}" | matched: ${result}`);

  const twiml = new twilio.twiml.VoiceResponse();

  if (result === 'distress') {
    await escalate({ type: 'distress', state: 'MEDICINE_CHECK', transcript: speechText });
    await playOrSay(twiml, 'Theek hai, main abhi aapke bete ko bata deta hoon. Aap dhyan rakhiye.', 'distress_ack.wav');
    twiml.hangup();
    return res.type('text/xml').send(twiml.toString());
  }

  if (result === 'unclear' && attempt < 2) {
    // Task 1.5: repeat once, this time explicitly offering the keypad.
    const retryPrompt = 'Mujhe theek se sunayi nahi diya. Haan ke liye ek dabayein, na ke liye do dabayein.';
    const gather = twiml.gather({
      input: 'speech dtmf',
      numDigits: 1,
      language: 'hi-IN',
      speechTimeout: 'auto',
      action: '/handle-medicine?attempt=2',
      method: 'POST',
    });
    await playOrSay(gather, retryPrompt, 'medicine_retry.wav');
    twiml.redirect('/handle-gas?attempt=1'); // if truly nothing comes back, don't hang the call — move on
    return res.type('text/xml').send(twiml.toString());
  }

  if (result === 'yes') {
    console.log('ACTION: trigger WhatsApp order to chemist — task_status: awaiting_approval');
  } else if (result === 'no') {
    console.log('ACTION: mark medicine task as deferred');
  } else {
    console.log('Still unclear after retry — marking medicine task for manual follow-up.');
  }

  const gasQuestion = 'Gas cylinder ka kya haal hai? Khatam hone wala hai ya abhi theek hai?';
  const gather = twiml.gather({
    input: 'speech dtmf',
    numDigits: 1,
    language: 'hi-IN',
    speechTimeout: 'auto',
    action: '/handle-gas?attempt=1',
    method: 'POST',
  });
  await playOrSay(gather, gasQuestion, 'gas_question.wav');
  twiml.redirect('/handle-gas?attempt=1');

  res.type('text/xml').send(twiml.toString());
});

// ---- GAS_BOOKING_CHECK, with 1.5 DTMF retry ----
app.post('/handle-gas', async (req, res) => {
  requirePublicUrl();
  const attempt = parseInt(req.query.attempt || '1', 10);
  const speechText = req.body.SpeechResult || '';
  const digit = req.body.Digits || '';
  const result = matchGasResponse(speechText, digit);

  console.log(`GAS_BOOKING_CHECK (attempt ${attempt}) — heard: "${speechText}" | digit: "${digit}" | matched: ${result}`);

  const twiml = new twilio.twiml.VoiceResponse();

  if (result === 'distress') {
    await escalate({ type: 'distress', state: 'GAS_BOOKING_CHECK', transcript: speechText });
    await playOrSay(twiml, 'Theek hai, main abhi aapke bete ko bata deta hoon. Aap dhyan rakhiye.', 'distress_ack2.wav');
    twiml.hangup();
    return res.type('text/xml').send(twiml.toString());
  }

  if (result === 'unclear' && attempt < 2) {
    const retryPrompt = 'Gas khatam ho raha hai to ek dabayein, theek hai to do dabayein.';
    const gather = twiml.gather({
      input: 'speech dtmf',
      numDigits: 1,
      language: 'hi-IN',
      speechTimeout: 'auto',
      action: '/handle-gas?attempt=2',
      method: 'POST',
    });
    await playOrSay(gather, retryPrompt, 'gas_retry.wav');
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

  const closing = `Theek hai, main ${CHILD_NAME} ko bata dunga sab kuch. Dhyan rakhiye. Namaste.`;
  await playOrSay(twiml, closing, 'closing.wav');
  twiml.hangup();

  res.type('text/xml').send(twiml.toString());
});

// ---- 1.6 — no-answer retry ----
// Twilio hits this when the call reaches a final state. If it never
// connected, retry once; if the retry also fails, escalate a missed-call alert.
app.post('/call-status', async (req, res) => {
  const attempt = parseInt(req.query.attempt || '1', 10);
  const status = req.body.CallStatus;

  console.log(`Call status callback — attempt ${attempt}: ${status}`);

  if (['no-answer', 'busy', 'failed'].includes(status)) {
    if (attempt < 2) {
      console.log(`No answer on attempt ${attempt}. Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      setTimeout(() => {
        placeCall(attempt + 1).catch((err) => console.error('Retry call failed:', err.message));
      }, RETRY_DELAY_MS);
    } else {
      console.log('Second attempt also unanswered — escalating missed-call alert.');
      await escalate({ type: 'missed_call', detail: `No answer after ${attempt} attempts`, lastStatus: status });
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
  console.log('Remember: run ngrok and set PUBLIC_BASE_URL in .env before triggering a call.');
});
