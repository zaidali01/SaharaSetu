# Sahay AI (सहाय) — Frontend Command Dashboard (Track D)

A high-trust eldercare logistics command center designed for adult children monitoring elderly parents in hometowns (e.g., Patna, Bihar) where parents interact solely through voice calls in local languages (Hindi/Bhojpuri/Maithili).

### Track D Rubric Deliverables (Tasks 4.1 – 4.6):
- **Tasks 4.1 & 4.2 (Document Intake & OCR Safety Gate):** Drag-and-drop prescription upload with simulated OCR entity extraction and pre-activation human review before any automated action activates.
- **Tasks 4.3 & 4.4 (Command Board & Payment Queue):** Tri-column status state machine (`Done & Verified`, `Needs Your Approval`, `Couldn't Complete / Blockers`) with 1-click WhatsApp orders and UPI dispatch approvals.
- **Task 4.5 (Alerts Feed):** Real-time banner escalation for consecutive missed scheduled calls and distress keyword detection (*"Chakkar aa raha hai"*).
- **Task 4.6 (Visual Agent Pipeline Trace):** Real-time telemetry observability console connecting Sarvam Indic ASR, Postgres State Engine, and WhatsApp/UPI Gateways.

### Stage Demo Features:
- Keyboard Shortcuts: Press `1` for Board, `2` for Document Review, `3` for Agent Trace.
- Floating `Demo Tools` dock to simulate live stage calls and distress triggers offline.

### Quick Start:
```bash
npm install
npm run dev
```
