const express = require('express');
const app = express();
app.use(express.json());

// You make this up. It just has to match what you paste in the Meta dashboard.
const VERIFY_TOKEN = 'sahara_setu_secret_token_123';

// 1. Webhook Verification Endpoint (Meta calls this once to verify)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.status(400).send('Missing mode or token');
  }
});

// 2. Message Receiving Endpoint (Meta sends WhatsApp messages here)
app.post('/webhook', (req, res) => {
  console.log('Incoming webhook:', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
  console.log(`Your verify token is: ${VERIFY_TOKEN}`);
});
