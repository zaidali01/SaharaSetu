// Sarvam TTS helper (Task 1.3)
// Converts Hindi text to a WAV file, saved into /public so Twilio's <Play>
// can fetch it over a public URL. Twilio cannot play raw base64 audio —
// it needs an actual URL it can GET.

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'public', 'audio');
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

async function generateSpeech(text, filename) {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    throw new Error('Missing SARVAM_API_KEY in .env');
  }

  const response = await fetch('https://api.sarvam.ai/text-to-speech', {
    method: 'POST',
    headers: {
      'api-subscription-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      target_language_code: 'hi-IN',
      speaker: 'shubh',
      model: 'bulbul:v3',
      pace: 0.95, // slightly slower — easier for an older listener to follow
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Sarvam TTS failed (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  if (!data.audios || !data.audios[0]) {
    throw new Error('Sarvam TTS returned no audio data');
  }

  const audioBuffer = Buffer.from(data.audios[0], 'base64');
  const filePath = path.join(PUBLIC_DIR, filename);
  fs.writeFileSync(filePath, audioBuffer);

  return `/audio/${filename}`; // relative path — server.js turns this into a full public URL
}

module.exports = { generateSpeech };
