# Voice Agent (Person 1 track) — Phase 1 complete

## Setup — every time you restart your machine or ngrok
1. `npm install`
2. `cp .env.example .env`, fill in real Twilio SID/token, from-number, parent test number, Sarvam key.
3. **Terminal 1**: `node server.js`
4. **Terminal 2**: `ngrok http 3000` — copy the `https://...ngrok-free.dev` (or `.app`) URL.
5. Paste that into `.env` as `PUBLIC_BASE_URL` (no trailing slash).
6. **Terminal 3**: `node call_trigger.js`

## IMPORTANT — fix before the real demo
Trial Twilio accounts play a mandatory "this is a trial account" disclaimer before every call.
It cannot be removed with code — only by adding a payment method to upgrade the account.
Decide now whether to upgrade; don't find out live on stage.

## Test each new piece separately, in this order — don't dump and pray

1. **Basic flow still works**: run the 3-terminal sequence, answer, say a clear "haan" and "theek hai". Confirm it completes and hangs up cleanly.
2. **DTMF fallback (1.5)**: call again, this time stay silent or mumble when asked about medicine. You should hear a retry prompt telling you to press 1 or 2. Press a key — confirm Terminal 1 logs the digit and the flow continues.
3. **Distress escalation (1.7)**: call again, say something like "mujhe tabiyat kharab lag rahi hai" when asked about medicine. Confirm: (a) the call ends with the escalation message, (b) `alerts.json` appears in this folder with an entry, (c) Terminal 1 logs `ESCALATION:`.
4. **No-answer retry (1.6)**: call again, don't pick up. Wait ~15 seconds. Your phone should ring again automatically (attempt 2). If you don't answer that either, check `alerts.json` — a `missed_call` entry should appear.

If any one of these fails, you'll know exactly which piece broke, instead of guessing across three changes at once.

## Status — Phase 1, Track A (Voice Agent)
- [x] 1.1 — Outbound call trigger (place_call.js, call_trigger.js)
- [x] 1.2 — STT via Twilio Gather (hi-IN), not custom Sarvam streaming — deliberate scope cut, see chat history
- [x] 1.3 — TTS via Sarvam (tts.js), falls back to robotic Twilio Say only if Sarvam API fails
- [x] 1.4 — State machine (server.js + matcher.js, mirrors ../person1/call_state_machine.json)
- [x] 1.5 — DTMF fallback — repeats once on unclear speech, then offers keypad (1/2)
- [x] 1.6 — No-answer retry — 2 attempts total, 15s apart, then escalates a missed-call alert
- [x] 1.7 — Distress-keyword detection AND escalation — writes to alerts.json, optionally forwards to Backend if BACKEND_ALERT_URL is set

## Files
- `place_call.js` — shared call-placing logic (used by CLI trigger and auto-retry)
- `escalate.js` — writes alerts.json, optionally forwards to Backend
- `matcher.js` — speech + DTMF keyword matching
- `tts.js` — Sarvam text-to-speech
- `server.js` — all webhook routes: /voice, /handle-medicine, /handle-gas, /call-status
- `call_trigger.js` — CLI entry point, run this to place a call manually
- `alerts.json` — created automatically on first escalation; not committed to git (add to .gitignore)

## Known limitations
- `alerts.json` is local-file based, not a database — fine for demo, would need real persistence for production.
- ngrok free tier URL changes on every restart — check `PUBLIC_BASE_URL` first if calls suddenly stop working.
- No-answer retry count resets if you restart server.js mid-retry (in-memory only) — acceptable for a hackathon demo.
- `BACKEND_ALERT_URL` integration with Person 3's real API is untested since that API doesn't exist yet — coordinate with them before assuming it works.
- matcher.js is substring matching, not real NLU — unusual phrasing falls into "unclear," which is expected and handled by the DTMF fallback.

## Still not done (outside Person 1's scope)
- Bhojpuri/Maithili language support — cut per the original plan's own instructions if time is short. Do not build this unless explicitly asked.
- 3.2t/3.3t guardrail testing — happens in Phase 3, needs Person 3 and 1 together.
