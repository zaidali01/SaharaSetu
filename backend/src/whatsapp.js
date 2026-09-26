require('dotenv').config();

/**
 * Send a WhatsApp template message via the Meta Cloud API.
 *
 * Outside the 24-hour customer-service window (which requires the *recipient*
 * to message us first) WhatsApp only permits pre-approved templates, so this
 * always sends `type: 'template'` rather than free-form text.
 *
 * @param {string} to        Recipient phone. Full international, digits only.
 * @param {string} templateName Must match an APPROVED template in Meta.
 * @param {string[]} params  Positional body params, matching {{1}}..{{n}}.
 * @param {object} [opts]
 * @param {string} [opts.language='en_US'] Template language code.
 * @returns {Promise<object>} Graph API response, or a dry-run/mock descriptor.
 */
async function sendWhatsAppMessage(to, templateName, params, opts = {}) {
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v23.0';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const language = opts.language || process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US';
  const dryRun = process.env.WHATSAPP_DRY_RUN === 'true';

  // Normalise to bare digits. WhatsApp rejects '+' and separators, and a stale
  // formatted number from the vendors table is a common dispatch failure.
  const recipient = String(to).replace(/\D/g, '');

  if (dryRun || !phoneNumberId || !accessToken) {
    const reason = dryRun ? 'WHATSAPP_DRY_RUN=true' : 'missing credentials';
    console.log(
      `[WhatsApp ${dryRun ? 'DRY RUN' : 'Mock'}] (${reason}) would send template ` +
      `'${templateName}' [${language}] to ${recipient} with params:`,
      params
    );
    return { id: `dry-run-${Date.now()}`, status: dryRun ? 'dry_run' : 'mocked', recipient, templateName, language, params };
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const body = {
    messaging_product: "whatsapp",
    to: recipient,
    type: "template",
    template: {
      name: templateName,
      language: { code: language },
      components: [{
        type: "body",
        parameters: params.map(p => ({ type: "text", text: String(p) }))
      }]
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${JSON.stringify(data)}`);
    }
    return data; // contains message ID
  } catch (err) {
    console.error('[WhatsApp Error]', err.message);
    throw err;
  }
}

module.exports = { sendWhatsAppMessage };
