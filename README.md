# SaharaSetu / Sahay AI (सहाय)

SaharaSetu is an orchestrated conversational agent system designed to help parents or caretakers request medicines and gas-cylinder deliveries for children via voice calls. It functions as a high-trust eldercare logistics command center for adult children monitoring elderly parents in hometowns where parents interact solely through voice calls in local languages (Hindi/Bhojpuri/Maithili).

## Track D: Frontend Command Dashboard
### Rubric Deliverables (Tasks 4.1 – 4.6):
- **Tasks 4.1 & 4.2 (Document Intake & OCR Safety Gate):** Drag-and-drop prescription upload with simulated OCR entity extraction and pre-activation human review before any automated action activates.
- **Tasks 4.3 & 4.4 (Command Board & Payment Queue):** Tri-column status state machine (`Done & Verified`, `Needs Your Approval`, `Couldn't Complete / Blockers`) with 1-click WhatsApp orders and UPI dispatch approvals.
- **Task 4.5 (Alerts Feed):** Real-time banner escalation for consecutive missed scheduled calls and distress keyword detection (*"Chakkar aa raha hai"*).
- **Task 4.6 (Visual Agent Pipeline Trace):** Real-time telemetry observability console connecting Sarvam Indic ASR, Postgres State Engine, and WhatsApp/UPI Gateways.

### Stage Demo Features:
- Keyboard Shortcuts: Press `1` for Board, `2` for Document Review, `3` for Agent Trace.
- Floating `Demo Tools` dock to simulate live stage calls and distress triggers offline.

### Frontend Quick Start:
```bash
npm install
npm run dev
```

## Track C: Backend & Orchestration (Phase 0 Setup)
This repository contains the foundational setup for Phase 0, including the shared task schema which all tracks will build against. See `docs/schema.json` for details.

### Branching Strategy
We use a standard feature-branch workflow:
- `main` - Stable production code.
- `dev` - Active integration branch.
- `feature/<track>-<feature-name>` - E.g., `feature/voice-call-trigger`, `feature/backend-schema`.

Please create pull requests to `dev` for review before merging.

### Project Structure & Documentation
- `docs/schema.json` — Shared task contract & state definitions.
- `docs/demo_scenario.md` — Locked live stage demo scenario (Task 0.3, Person 4).
- `src/` — Track D: React/Vite Frontend Command Dashboard.
- `backend/` — Track C: Node/Express & PostgreSQL Backend Engine.
- `voice-agent/` — Track A: Outbound Voice Agent & STT/TTS caller pipeline.

