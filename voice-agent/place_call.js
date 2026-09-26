// Shared call-placing logic. Used by call_trigger.js (manual CLI trigger)
// AND server.js (automatic retry on no-answer, task 1.6). Kept in one place
// so both callers can't drift out of sync.

require('dotenv').config();
const twilio = require('twilio');

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER,
  PARENT_TEST_NUMBER,
  PUBLIC_BASE_URL,
} = process.env;

function requireEnv(name, value) {
  if (!value) throw new Error(`Missing required env var: ${name}. Check your .env file.`);
  return value;
}

function getClient() {
  requireEnv('TWILIO_ACCOUNT_SID', TWILIO_ACCOUNT_SID);
  requireEnv('TWILIO_AUTH_TOKEN', TWILIO_AUTH_TOKEN);
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

async function placeCall(attempt = 1) {
  requireEnv('TWILIO_FROM_NUMBER', TWILIO_FROM_NUMBER);
  requireEnv('PARENT_TEST_NUMBER', PARENT_TEST_NUMBER);
  requireEnv('PUBLIC_BASE_URL', PUBLIC_BASE_URL);

  const client = getClient();

  try {
    const call = await client.calls.create({
      to: PARENT_TEST_NUMBER,
      from: TWILIO_FROM_NUMBER,
      url: `${PUBLIC_BASE_URL}/voice`,
      // statusCallback fires when the call reaches a final state (answered,
      // no-answer, busy, failed). server.js's /call-status route uses this
      // to decide whether to retry. attempt is passed via query string since
      // Twilio's webhook body won't carry it for us.
      statusCallback: `${PUBLIC_BASE_URL}/call-status?attempt=${attempt}`,
      statusCallbackEvent: ['completed'],
      statusCallbackMethod: 'POST',
    });

    console.log(`Call attempt ${attempt} triggered. SID: ${call.sid} | Status: ${call.status}`);
    return call;
  } catch (err) {
    if (err.code === 21219) {
      console.error('ERROR: "to" number is not a verified caller ID on this trial account.');
    } else if (err.code === 21211) {
      console.error('ERROR: Invalid "to" phone number format. Use E.164, e.g. +919430483115');
    } else {
      console.error('Call failed:', err.message);
    }
    throw err;
  }
}

module.exports = { placeCall };
