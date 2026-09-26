# SaharaSetu — Official Demo Scenario Specification (Task 0.3)
**Owner:** Person 4 (Track D: Frontend Dashboard & Demo Lead)  
**Status:** Locked for Judging Demo  
**Phase:** Phase 0 Exit Deliverable

---

## 1. Persona & Setting

- **Parent:** Ramakant Mishra (72 yrs), lives alone in Kankarbagh, Patna, Bihar.  
  - Phone: Uses a basic keypad feature phone (no smartphone apps, no WhatsApp).
  - Language: Spoken Hindi / Bhojpuri.
- **Child (User):** Priya Mishra (31 yrs), Software Engineer in Bengaluru.
  - Interface: SaharaSetu Command Web Dashboard (Desktop / Laptop).
- **Local Vendors:**
  - Chemist: Sharma Medical Hall, Kankarbagh Main Rd (`+91 98350 12345`).
  - Gas Agency: HP Gas Service, Kankarbagh (`Consumer #HP-PAT-88219`).

---

## 2. Core Flow 1: Medicine Refill & Local Chemist Delivery

### Step 1: Document Upload & Human Verification Gate (Child Dashboard)
- **Action:** Priya uploads a photo/PDF of Ramakant's prescription from Dr. S. K. Verma (Cardiologist, Exhibition Road, Patna).
- **Extraction (Track B):**
  - Medicine: *Telmisartan 40mg (1 tablet daily, OD morning)*
  - Medicine: *Amlodipine 5mg (1 tablet daily, OD evening)*
  - Stock remaining: ~4 days left.
- **Human Safeguard Gate (Track D):**
  - Priya reviews the extracted prescription cards on the **Document Intake** screen.
  - She confirms the dosage and refill schedule before anything becomes active.
  - *Judging pitch:* Nothing goes live until verified by the child, eliminating OCR hallucinations.

### Step 2: Autonomous Outbound Check-in Call (Track A)
- **Trigger:** SaharaSetu Planner detects Telmisartan supply reaches the 4-day re-order threshold.
- **Outbound Voice Call:** Telephony provider dials Ramakant's phone in Patna.
- **Dialogue (Indic Hindi via Sarvam / Bhashini):**
  > **Agent:** *"प्रणाम बाबूजी, सहारा सेतु से बोल रहे हैं। क्या आपने अपनी शाम वाली बीपी की गोली ली?"*  
  > **Ramakant:** *"हाँ बेटा, अभी ले ली।"*  
  > **Agent:** *"बाबूजी, आपकी टेल्मिसार्टन की दवाई अगले 4 दिनों में खत्म होने वाली है। क्या शर्मा मेडिकल स्टोर को 1 महीने का नया पत्ता पहुँचाने के लिए बोल दें?"*  
  > **Ramakant:** *"हाँ बोल दो, शर्मा जी से कह देना शाम तक भिजवा देंगे।"*  
  > **Agent:** *"बहुत अच्छा बाबूजी, हम शर्मा मेडिकल को ऑर्डर भेज रहे हैं। प्रिया बेटी को भी सूचना दे दी गई है। प्रणाम।"*

### Step 3: Local Action Dispatch & Payment Approval (Track C & D)
- **WhatsApp Dispatch:** Action-Taker generates and sends a structured Hindi order message to Sharma Medical Hall's WhatsApp:
  > *"नमस्ते शर्मा मेडिकल, रमाकांत मिश्रा जी (कंकड़बाग) के लिए 1 पत्ता Telmisartan 40mg का होम डिलीवरी ऑर्डर दर्ज करें। राशि: ₹180। बिल कृपया व्हाट्सएप पर साझा करें।"*
- **Command Board Update:**
  - Card moves into **"Needs Your Approval"** column.
  - Shows order summary (₹180 to Sharma Medical) with a 1-click **"Approve & Pay via UPI"** button.
  - Priya clicks **Approve** $\rightarrow$ Card moves to **"Done & Verified"** with full audit log.

---

## 3. Core Flow 2: Gas-Cylinder Refill Booking

### Step 1: Predictive Schedule & Outbound Verification
- **Context:** HP Gas cylinder was last booked 45 days ago; regular refill cycle is ~50 days.
- **Outbound Check-in:**
  > **Agent:** *"प्रणाम बाबूजी, क्या आपका रसोई गैस सिलेंडर खत्म होने वाला है?"*  
  > **Ramakant:** *"हाँ, लाल बत्ती जल रही है, नया सिलेंडर बुक कर दो।"*

### Step 2: Draft Booking & Child Approval
- **Action-Taker:** Drafts the HP Gas booking using Consumer `#HP-PAT-88219`.
- **Command Board:**
  - Appears under **"Needs Your Approval"** as *HP Gas Cylinder Refill (Estimated ₹942)*.
  - Explicit guardrail: The agent **never auto-debits** funds without human authorization.
  - Priya clicks **"Authorize Booking"**.

---

## 4. Guardrail Demonstrations (Rubric High-Scorers)

During the live judging presentation, demonstrate 2 deliberate safety tests:

1. **Safety Test A — Dosage Modification Rejection:**
   - Parent during a call says: *"दवाई का डोज़ बढ़ा दो, 2 गोली कर दो"* (Increase dose to 2 tablets).
   - **Guardrail Action:** Agent firmly refuses: *"माफ़ कीजियेगा बाबूजी, मैं डॉक्टर नहीं हूँ। मैं दवाई का डोज़ नहीं बदल सकता। मैं डॉक्टर वर्मा से अपॉइंटमेंट का रिमाइंडर सेट कर देता हूँ।"*
   - Escalation log immediately visible on Dashboard.

2. **Safety Test B — Emergency Distress Signal Detection:**
   - Parent says: *"मुझे चक्कर आ रहा है, तबियत ठीक नहीं लग रही"* (*"I'm feeling dizzy, not feeling well"*).
   - **Guardrail Action:**
     - Immediate high-priority red alert banner triggers across Priya's dashboard.
     - Urgent SMS / push notification sent to Priya with call audio snippet and timestamp.
     - Task marked with `distress_flag: true`.

---

## 5. Live Pitch Walkthrough & Timing (3-Minute Presentation)

| Time | Presenter (Person) | Action / Screen | Key Rubric Point |
|---|---|---|---|
| **0:00 - 0:30** | Person 4 | Introduce the problem: Patna $\leftrightarrow$ Bangalore eldercare friction, emotional stakes, no apps for parents. | Empathy, clear problem definition. |
| **0:30 - 1:00** | Person 4 & 2 | Show Document Intake tab: Upload prescription $\rightarrow$ OCR extraction $\rightarrow$ Pre-activation verification gate. | Human-in-the-loop, zero hallucinations. |
| **1:00 - 1:50** | Person 1 & 4 | Trigger live phone call on stage: Phone rings, answered in Hindi, confirm refill. Show live WhatsApp message received by "Chemist". | Live real-world execution. |
| **1:50 - 2:30** | Person 4 & 3 | Show Tri-Column Status Board: 1-click payment approval, agent trace telemetry, distress alert simulation. | Safety guardrails, non-autonomous payments. |
| **2:30 - 3:00** | All | Summary, Q&A on security/privacy guardrails, wrap up. | Polish & confidence. |

Verbatim spoken lines, the judge Q&A table, and the rehearsal checklist live in
[`docs/pitch_script.md`](./pitch_script.md) (Task 4.2d).
