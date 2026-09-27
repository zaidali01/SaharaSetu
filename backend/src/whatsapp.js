require('dotenv').config();

/**
 * Outbound WhatsApp via Twilio.
 *
 * Why Twilio and not the Meta Cloud API: the Meta test WABA's sender
 * (1447322895120105) is status BANNED, so every send returned HTTP 200
 * `accepted` and nothing was ever delivered. Twilio's WhatsApp sandbox is
 * free and needs no business verification, which is the right trade for a
 * hackathon.
 *
 * The signature is unchanged from the Meta implementation so actionTaker's
 * single call site keeps working. `templateName` is now advisory metadata
 * only: Twilio sandbox sends free-form text and requires no template
 * approval, so the params are rendered into a readable body instead of
 * being posted as template components.
 *
 * DELIVERY IS NOT PROVEN BY A 2xx. Twilio accepts a message and reports
 * `status: queued`; handset delivery arrives later on the status callback.
 * Read the callback, or call fetchMessage, before telling anyone it landed.
 */

const DEFAULT_COUNTRY_CODE = process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '91';

/**
 * Normalise a phone number to the `whatsapp:+<E.164>` address Twilio wants.
 *
 * Vendor rows carry whatever a human typed, so `9876543210`, `+91 98765 43210`
 * and `whatsapp:+919876543210` all have to work. A bare 10-digit Indian
 * mobile gets the default country code prefixed.
 */
function toWhatsAppAddress(raw) {
  let s = String(raw || '').trim();

  // Already a full Twilio address, e.g. whatsapp:+919876543210
  if (/^whatsapp:/i.test(s)) {
    s = s.replace(/^whatsapp:/i, '');
  }

  const hasPlus = s.startsWith('+');
  const digits = s.replace(/\D/g, '');

  if (!digits) throw new Error(`Cannot build WhatsApp address from "${raw}"`);

  // "919876543210" (with or without +) is already country-code prefixed.
  // "9876543210" is a bare national number and needs one.
  let e164 = hasPlus ? `+${digits}` : `+${digits}`;
  if (!hasPlus && digits.length === 10) e164 = `+${DEFAULT_COUNTRY_CODE}${digits}`;

  return `whatsapp:${e164}`;
}

/** Render the order-confirmation params into free-form text. */
function buildOrderBody(params) {
  const [medicineName, quantity, deliveryAddress] = params;
  return [
    'SaharaSetu — medicine order request',
    '',
    `Medicine: ${medicineName ?? 'n/a'}`,
    `Quantity: ${quantity ?? 'n/a'}`,
    `Deliver to: ${deliveryAddress ?? 'n/a'}`,
    '',
    'A guardian requested this by phone and the child has approved it for you to fill. ' +
      'Please confirm availability and collect payment directly. No payment has been taken by this message.',
  ].join('\n');
}

/**
 * Send a WhatsApp message.
 *
 * @param {string} to           Recipient phone in any common format.
 * @param {string} [templateName] Legacy Meta template name; kept as metadata.
 * @param {string[]} [params]   Positional order fields: name, quantity, address.
 * @param {object} [opts]
 * @param {string} [opts.body]  Explicit body, overriding the rendered default.
 * @returns {Promise<object>} `{ id, status, recipient, ... }` — `.id` and
 *   `.status` are the fields actionTaker logs.
 */
async function sendWhatsAppMessage(to, templateName, params = [], opts = {}) {
  const dryRun = process.env.WHATSAPP_DRY_RUN === 'true';
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  const body = opts.body || buildOrderBody(params);
  const legacyTemplate = templateName || process.env.WHATSAPP_TEMPLATE_NAME || 'order_confirmation';

  let recipient;
  try {
    recipient = toWhatsAppAddress(to);
  } catch (err) {
    if (dryRun) recipient = `whatsapp:+<invalid:${to}>`;
    else throw err;
  }

  const missing = !accountSid || !authToken;
  if (dryRun || missing) {
    const reason = dryRun ? 'WHATSAPP_DRY_RUN=true' : 'missing TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN';
    console.log(
      `[WhatsApp ${dryRun ? 'DRY RUN' : 'Mock'}] (${reason}) would send from ${from} to ${recipient}:`,
      body.replace(/\n/g, ' | ')
    );
    return {
      id: `dry-run-${Date.now()}`,
      status: dryRun ? 'dry_run' : 'mocked',
      provider: 'twilio',
      recipient,
      from,
      body,
      legacyTemplate,
    };
  }

  // Required lazily so the dry-run branch above works without the SDK.
  const twilio = require('twilio');
  const client = twilio(accountSid, authToken);

  try {
    const message = await client.messages.create({ from, to: recipient, body });

    console.log(
      `[WhatsApp] sid=${message.sid} status=${message.status} to=${recipient} ` +
        `(queued, NOT yet delivered — confirm via status callback)`
    );

    return {
      id: message.sid,
      // Twilio reports queued/sent/delivered/read/failed. Anything other than
      // "delivered"/"read" at this point is NOT proof the handset got it.
      status: message.status,
      provider: 'twilio',
      recipient,
      from,
      body,
      legacyTemplate,
      price: message.price,
      errorCode: message.errorCode,
      raw: message,
    };
  } catch (err) {
    // Twilio's error codes matter here. On a Trial account an unopted-in or
    // unverified recipient fails at send time (e.g. 21211 "to is not a
    // valid mobile number", 21610 "not authorized"). Surfacing the code
    // stops this degrading into another silent-success bug like the Meta ban.
    console.error(
      `[WhatsApp Error] code=${err.code} status=${err.status} moreInfo=${err.moreInfo || 'n/a'} :: ${err.message}`
    );
    const wrapped = new Error(`Twilio WhatsApp send failed (code ${err.code}): ${err.message}`);
    wrapped.code = err.code;
    wrapped.twillioStatus = err.status;
    wrapped.moreInfo = err.moreInfo;
    wrapped.recipient = recipient;
    throw wrapped;
  }
}

/**
 * Look up the live delivery state of a sent message.
 *
 * This is the check the Meta integration never had: it lets a caller confirm
 * handset delivery instead of trusting the initial `queued` response.
 */
async function fetchMessageStatus(messageSid) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) throw new Error('Missing TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN');
  const twilio = require('twilio');
  const client = twilio(accountSid, authToken);
  const m = await client.messages(messageSid).fetch();
  return {
    id: m.sid,
    status: m.status,
    errorCode: m.errorCode,
    errorMessage: m.errorMessage,
    dateSent: m.dateSent,
    dateDelivered: m.dateDelivered,
    to: m.to,
  };
}

module.exports = { sendWhatsAppMessage, fetchMessageStatus, toWhatsAppAddress, buildOrderBody };
