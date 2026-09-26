# Voice Agent (Person 1 track)

## Setup — do this every time you restart your machine or ngrok
1. `npm install`
2. `cp .env.example .env`, fill in real Twilio SID, Auth Token, from-number, parent test number, Sarvam API key.
3. **Terminal 1**: `node server.js` — starts the webhook server on port 3000.
4. **Terminal 2**: `ngrok http 3000` — gives you a public HTTPS URL. It changes every time you restart ngrok on the free tier.
5. Copy that URL into `.env` as `PUBLIC_BASE_URL` (no trailing slash), e.g. `PUBLIC_BASE_URL=https://abcd1234.ngrok-free.app`
6. **Terminal 3**: `node call_trigger.js` — places the actual call.

If it works: phone rings, plays a real Sarvam Hindi voice asking about medicine, listens for your spoken answer, asks about gas, listens again, says goodbye. Watch Terminal 1's logs — every match ("heard: ... matched: yes/no/unclear/distress") prints there in real time, which is how you debug during rehearsal.

## Status
- [x] 1.1 — Outbound call trigger (call_trigger.js)
- [x] 1.2 — STT for Hindi — using Twilio's built-in Gather speech recognition (language="hi-IN"), NOT a custom Sarvam streaming pipeline. This was a deliberate scope cut — see chat history for why.
- [x] 1.3 — TTS via Sarvam (tts.js) — real Hindi voice, not robotic Twilio Say. Falls back to Twilio Say only if the Sarvam API call fails.
- [x] 1.4 — Conversation state machine — implemented directly in server.js + matcher.js (mirrors ../person1/call_state_machine.json)
- [ ] 1.5 — DTMF fallback — NOT yet wired. Gather is speech-only right now; add `input: 'speech dtmf'` and numeric routing.
- [ ] 1.6 — No-answer retry logic — NOT implemented. No retry count tracking exists yet.
- [ ] 1.7 — Distress-keyword detection — keyword matching works (matcher.js), but the actual escalation (WhatsApp/SMS to child) is a `console.log` placeholder in server.js. Needs wiring to Backend (Person 3) once their API exists.

## Known limitations
- Every TTS phrase makes a live Sarvam API call and writes a new .wav file on every request — fine for a demo, wasteful for production (should cache the fixed phrases).
- ngrok free tier URL changes on every restart. If your call stops working, check `PUBLIC_BASE_URL` is still correct first.
- `matcher.js` keyword matching is naive substring matching, not real NLU. A parent phrasing something unusually will fall into "unclear" — expected and acceptable for the demo script.
