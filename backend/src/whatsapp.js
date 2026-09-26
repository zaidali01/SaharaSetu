require('dotenv').config();

async function sendWhatsAppMessage(to, templateName, params) {
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.log(`[WhatsApp Mock] Would send template '${templateName}' to ${to} with params:`, params);
    return { id: 'mock-msg-id-123', status: 'mocked' };
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const body = {
    messaging_product: "whatsapp",
    to: to.replace('+', ''), // Strip + for WhatsApp API
    type: "template",
    template: {
      name: templateName,
      language: { code: "en_US" },
      components: [{
        type: "body",
        parameters: params.map(p => ({ type: "text", text: p }))
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
