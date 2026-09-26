// Run this ONCE (and again any time CHILD_NAME/CHEMIST_NAME/DAYS_LEFT change)
// to pre-generate every fixed phrase as a .wav file. The live call server
// then just serves these static files instead of calling Sarvam during
// an actual call — this is what fixes the 5-second TwiML timeout.
//
// Usage: node pregenerate_audio.js

require('dotenv').config();
const { generateSpeech } = require('./tts');

const CHILD_NAME = process.env.CHILD_NAME || 'aapke bete';
const CHEMIST_NAME = process.env.CHEMIST_NAME || 'chemist';
const DAYS_LEFT = process.env.DAYS_LEFT || '4';

const PHRASES = [
  {
    filename: 'greeting.wav',
    text: `Namaste! Main ${CHILD_NAME} ki taraf se baat kar raha hoon. Aapse do minute baat karni hai.`,
  },
  {
    filename: 'medicine_question.wav',
    text: `Aapki BP ki dawai ab sirf ${DAYS_LEFT} din ki bachi hai. Kya main ${CHEMIST_NAME} ko order bhej doon?`,
  },
  {
    filename: 'medicine_retry.wav',
    text: 'Mujhe theek se sunayi nahi diya. Haan ke liye ek dabayein, na ke liye do dabayein.',
  },
  {
    filename: 'gas_question.wav',
    text: 'Gas cylinder ka kya haal hai? Khatam hone wala hai ya abhi theek hai?',
  },
  {
    filename: 'gas_retry.wav',
    text: 'Gas khatam ho raha hai to ek dabayein, theek hai to do dabayein.',
  },
  {
    filename: 'distress_ack.wav',
    text: 'Theek hai, main abhi aapke bete ko bata deta hoon. Aap dhyan rakhiye.',
  },
  {
    filename: 'distress_ack2.wav',
    text: 'Theek hai, main abhi aapke bete ko bata deta hoon. Aap dhyan rakhiye.',
  },
  {
    filename: 'dosage_refusal.wav',
    text: 'Maaf kijiye, main doctor nahi hoon. Main dawai ki khuraak nahi badal sakta. Main aapke bete ko bata deta hoon, woh doctor se baat karenge.',
  },
  {
    filename: 'closing.wav',
    text: `Theek hai, main ${CHILD_NAME} ko bata dunga sab kuch. Dhyan rakhiye. Namaste.`,
  },
];

async function run() {
  console.log(`Pre-generating ${PHRASES.length} audio files...`);
  for (const { filename, text } of PHRASES) {
    try {
      await generateSpeech(text, filename);
      console.log(`  OK: ${filename}`);
    } catch (err) {
      console.error(`  FAILED: ${filename} — ${err.message}`);
    }
  }
  console.log('Done. Restart server.js if it was already running.');
}

run();
