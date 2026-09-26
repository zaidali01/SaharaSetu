// Task 1.1 — Outbound call trigger via Twilio
//
// UPDATED: now points at the webhook server (server.js) instead of inline
// TwiML, so the call runs the real state machine (1.2 Gather STT, 1.3 Sarvam
// TTS, 1.4 routing) instead of a one-line placeholder greeting.
//
// Before running this: start server.js AND have ngrok running, with
// PUBLIC_BASE_URL in .env set to the ngrok https URL.

require('dotenv').config();
const twilio = require('twilio');

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER,
  PARENT_TEST_NUMBER,
  PUBLIC_BASE_URL,
} = process.env;

// Fail loudly and early if any required env var is missing —
// silent undefined values here cause confusing Twilio API errors later.
function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing required env var: ${name}. Check your .env file.`);
  }
  return value;
}

requireEnv('TWILIO_ACCOUNT_SID', TWILIO_ACCOUNT_SID);
requireEnv('TWILIO_AUTH_TOKEN', TWILIO_AUTH_TOKEN);
requireEnv('TWILIO_FROM_NUMBER', TWILIO_FROM_NUMBER);
requireEnv('PARENT_TEST_NUMBER', PARENT_TEST_NUMBER);
requireEnv('PUBLIC_BASE_URL', PUBLIC_BASE_URL);

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

async function triggerCall() {
  try {
    const call = await client.calls.create({
      to: PARENT_TEST_NUMBER,
      from: TWILIO_FROM_NUMBER,
      url: `${PUBLIC_BASE_URL}/voice`, // Twilio POSTs here to get TwiML — this is server.js
    });

    console.log('Call triggered successfully.');
    console.log('Call SID:', call.sid);
    console.log('Status:', call.status);
    return call;
  } catch (err) {
    // Common failure modes, called out explicitly instead of a raw stack trace:
    if (err.code === 21219) {
      console.error('ERROR: The "to" number is not a verified caller ID on this trial account.');
    } else if (err.code === 21211) {
      console.error('ERROR: Invalid "to" phone number format. Use E.164 format, e.g. +919430483115');
    } else {
      console.error('Call failed:', err.message);
    }
    throw err;
  }
}

// Run directly: `node call_trigger.js`
if (require.main === module) {
  triggerCall();
}

module.exports = { triggerCall };
