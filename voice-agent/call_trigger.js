// Task 1.1 — manual CLI entry point for triggering a call.
// Actual call-placing logic lives in place_call.js, shared with the
// automatic no-answer retry in server.js (task 1.6).

const { placeCall } = require('./place_call');

if (require.main === module) {
  placeCall(1).catch((err) => {
    console.error('Failed to trigger call:', err.message);
    process.exit(1);
  });
}

module.exports = { placeCall };
