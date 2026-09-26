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

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use('/audio', express.static(path.join(__dirname, 'public', 'audio')));

const PORT = process.env.PORT || 3000;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL;
const CHILD_NAME = process.env.CHILD_NAME || 'aapke bete';
const RETRY_DELAY_MS = 15000;

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
  twiml.redirect('/voice');

  res.type('text/xml').send(twiml.toString());
});

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
    playStatic(twiml, 'distress_ack.wav', 'Theek hai, main bata deta hoon.');
    twiml.hangup();
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
    twiml.redirect('/handle-gas?attempt=1');
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

app.listen(PORT, () => {
  console.log(`Voice agent server listening on port ${PORT}`);
  console.log('Have you run `node pregenerate_audio.js` yet? If not, do that first.');
  console.log('Remember: run ngrok and set PUBLIC_BASE_URL in .env before triggering a call.');
});
