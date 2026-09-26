// Voice agent webhook server — Tasks 1.2 (STT via Twilio Gather),
// 1.3 (TTS via Sarvam), 1.4 (state machine routing), 1.6 (no-answer retry hook).
//
// Requires a public URL pointing at this server. For local dev, run ngrok:
//   ngrok http 3000
// Then set PUBLIC_BASE_URL in .env to the ngrok https URL (no trailing slash).

require('dotenv').config();
const express = require('express');
const path = require('path');
const twilio = require('twilio');
const { generateSpeech } = require('./tts');
const { matchMedicineResponse, matchGasResponse } = require('./matcher');

const app = express();
app.use(express.urlencoded({ extended: false })); // Twilio posts form-encoded data
app.use('/audio', express.static(path.join(__dirname, 'public', 'audio')));

const PORT = process.env.PORT || 3000;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL; // e.g. https://xxxx.ngrok-free.app
const CHILD_NAME = process.env.CHILD_NAME || 'aapke bete';
const CHEMIST_NAME = process.env.CHEMIST_NAME || 'chemist';
const DAYS_LEFT = process.env.DAYS_LEFT || '4';

function requirePublicUrl() {
  if (!PUBLIC_BASE_URL) {
    throw new Error(
      'PUBLIC_BASE_URL is not set in .env. Run ngrok and set it to the https URL it gives you.'
    );
  }
}

// Wraps a piece of Hindi text: generates TTS audio, returns a <Play> verb
// pointing at it. Falls back to Twilio's built-in <Say> if Sarvam fails,
// so a live demo doesn't go completely silent on an API hiccup.
async function playOrSay(twiml, text, filename) {
  try {
    const audioPath = await generateSpeech(text, filename);
    twiml.play(`${PUBLIC_BASE_URL}${audioPath}`);
  } catch (err) {
    console.error('TTS failed, falling back to robotic Say:', err.message);
    twiml.say({ language: 'hi-IN' }, text);
  }
}

// Entry point — Twilio hits this when the call connects.
app.post('/voice', async (req, res) => {
  requirePublicUrl();
  const twiml = new twilio.twiml.VoiceResponse();

  const greeting = `Namaste! Main ${CHILD_NAME} ki taraf se baat kar raha hoon. Aapse do minute baat karni hai.`;
  await playOrSay(twiml, greeting, 'greeting.wav');

  const medicineQuestion = `Aapki BP ki dawai ab sirf ${DAYS_LEFT} din ki bachi hai. Kya main ${CHEMIST_NAME} ko order bhej doon?`;

  const gather = twiml.gather({
    input: 'speech',
    language: 'hi-IN',
    speechTimeout: 'auto',
    action: '/handle-medicine',
    method: 'POST',
  });
  await playOrSay(gather, medicineQuestion, 'medicine_question.wav');

  // If Gather times out with no speech at all, Twilio falls through here.
  twiml.say({ language: 'hi-IN' }, 'Mujhe aapki awaaz nahi mili. Phir se koshish karte hain.');
  twiml.redirect('/voice');

  res.type('text/xml').send(twiml.toString());
});

// Handles the parent's answer to the medicine question.
app.post('/handle-medicine', async (req, res) => {
  requirePublicUrl();
  const speechText = req.body.SpeechResult || '';
  const result = matchMedicineResponse(speechText);

  console.log('MEDICINE_CHECK — heard:', speechText, '| matched:', result);

  const twiml = new twilio.twiml.VoiceResponse();

  if (result === 'distress') {
    // TODO (1.7 wiring): trigger real alert to child here (WhatsApp/SMS/webhook to Backend).
    console.log('DISTRESS DETECTED — escalate immediately.');
    await playOrSay(
      twiml,
      'Theek hai, main abhi aapke bete ko bata deta hoon. Aap dhyan rakhiye.',
      'distress_ack.wav'
    );
    twiml.hangup();
    return res.type('text/xml').send(twiml.toString());
  }

  if (result === 'yes') {
    console.log('ACTION: trigger WhatsApp order to chemist — task_status: awaiting_approval');
  } else if (result === 'no') {
    console.log('ACTION: mark medicine task as deferred');
  } else {
    console.log('UNCLEAR — should offer DTMF fallback (task 1.5, not yet wired here)');
  }

  const gasQuestion = 'Gas cylinder ka kya haal hai? Khatam hone wala hai ya abhi theek hai?';
  const gather = twiml.gather({
    input: 'speech',
    language: 'hi-IN',
    speechTimeout: 'auto',
    action: '/handle-gas',
    method: 'POST',
  });
  await playOrSay(gather, gasQuestion, 'gas_question.wav');

  twiml.redirect('/handle-gas'); // if no speech at all, proceed to closing anyway
  res.type('text/xml').send(twiml.toString());
});

// Handles the parent's answer to the gas cylinder question, then closes the call.
app.post('/handle-gas', async (req, res) => {
  requirePublicUrl();
  const speechText = req.body.SpeechResult || '';
  const result = matchGasResponse(speechText);

  console.log('GAS_BOOKING_CHECK — heard:', speechText, '| matched:', result);

  const twiml = new twilio.twiml.VoiceResponse();

  if (result === 'distress') {
    console.log('DISTRESS DETECTED — escalate immediately.');
    await playOrSay(
      twiml,
      'Theek hai, main abhi aapke bete ko bata deta hoon. Aap dhyan rakhiye.',
      'distress_ack2.wav'
    );
    twiml.hangup();
    return res.type('text/xml').send(twiml.toString());
  }

  if (result === 'low') {
    console.log('ACTION: draft gas booking — task_status: awaiting_approval');
  } else if (result === 'fine') {
    console.log('ACTION: mark gas task as done, no action needed');
  } else {
    console.log('UNCLEAR — should offer DTMF fallback (task 1.5, not yet wired here)');
  }

  const closing = `Theek hai, main ${CHILD_NAME} ko bata dunga sab kuch. Dhyan rakhiye. Namaste.`;
  await playOrSay(twiml, closing, 'closing.wav');
  twiml.hangup();

  res.type('text/xml').send(twiml.toString());
});

app.listen(PORT, () => {
  console.log(`Voice agent server listening on port ${PORT}`);
  console.log('Remember: run ngrok and set PUBLIC_BASE_URL in .env before triggering a call.');
});
