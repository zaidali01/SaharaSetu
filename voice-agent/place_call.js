// Shared call-placing logic. Used by call_trigger.js (manual CLI trigger)
// AND server.js (automatic retry on no-answer, task 1.6). Kept in one place
// so both callers can't drift out of sync.

require('dotenv').config();
require('dns').setDefaultResultOrder('ipv4first'); // fixes 30s timeouts on networks that resolve Twilio's hostname to unreachable IPv6
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

async function placeCall(attempt = 1, phone = null, taskId = null) {
  requireEnv('TWILIO_FROM_NUMBER', TWILIO_FROM_NUMBER);
  // TEST ONLY: Twilio trial can only dial verified numbers. If FORCE_DIAL_NUMBER
  // is set, every call goes there regardless of the phone the backend sent.
  // Blank it once the account is upgraded / real parent numbers are in the DB.
  const forced = process.env.FORCE_DIAL_NUMBER;
  if (forced && phone && phone !== forced) {
    console.warn(`[FORCE_DIAL] Backend asked for ${phone}, dialing ${forced} instead (trial override).`);
  }
  const targetPhone = forced || phone || process.env.PARENT_TEST_NUMBER;  if (!targetPhone) requireEnv('PARENT_TEST_NUMBER', process.env.PARENT_TEST_NUMBER);
  requireEnv('PUBLIC_BASE_URL', PUBLIC_BASE_URL);

  const client = getClient();
  const qs = taskId ? `?taskId=${taskId}` : '';

  try {
    const call = await client.calls.create({
      to: targetPhone,
      from: TWILIO_FROM_NUMBER,
      url: `${PUBLIC_BASE_URL}/voice${qs}`,
      // statusCallback fires when the call reaches a final state (answered,
      // no-answer, busy, failed). server.js's /call-status route uses this
      // to decide whether to retry. attempt is passed via query string since
      // Twilio's webhook body won't carry it for us.
      statusCallback: `${PUBLIC_BASE_URL}/call-status?attempt=${attempt}${taskId ? `&taskId=${taskId}` : ''}`,
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
