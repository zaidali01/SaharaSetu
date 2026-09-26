// Escalation handler (task 1.7's actual action, not just detection).
//
// Right now this writes to a local alerts.json file and logs loudly to
// console, because Person 3's backend doesn't have a real alert endpoint
// yet. This is a STAND-IN, not the final implementation.
//
// Once Backend exposes a real endpoint, set BACKEND_ALERT_URL in .env and
// this will POST there automatically instead of only logging locally —
// no other code needs to change.

const fs = require('fs');
const path = require('path');

const ALERTS_FILE = path.join(__dirname, 'alerts.json');

function readAlerts() {
  if (!fs.existsSync(ALERTS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

async function escalate(alert) {
  const entry = { ...alert, timestamp: new Date().toISOString() };

  const alerts = readAlerts();
  alerts.push(entry);
  fs.writeFileSync(ALERTS_FILE, JSON.stringify(alerts, null, 2));

  console.log('ESCALATION:', JSON.stringify(entry));

  const backendUrl = process.env.BACKEND_ALERT_URL;
  if (backendUrl) {
    try {
      await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      console.log('Escalation also forwarded to Backend at', backendUrl);
    } catch (err) {
      console.error('Failed to forward escalation to Backend:', err.message);
      // Local alerts.json write already succeeded above, so the escalation
      // isn't lost even if Backend is unreachable — important for a demo
      // where the Backend service might not be running.
    }
  }

  return entry;
}

module.exports = { escalate };
