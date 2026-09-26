# Document Intelligence & Vision OCR Engine (Track B / Role 2)

End-to-end multimodal document intake & schedule extraction engine for doctor prescriptions, utility bills, and pension life-certificate notices in the **Sahay AI (सहाय)** eldercare ecosystem.

---

## 🌟 Key Features
- **Multimodal Gemini 2.0 / 1.5 Flash Vision Extraction**: Extracts structured clinical entities, normalized recurrence frequencies, 24h trigger time slots, and pixel-relative bounding box overlays (`[ymin, xmin, ymax, xmax]` normalized to 0–1000).
- **Three Document Classes**: `PRESCRIPTION`, `ELECTRICITY_BILL` / `UTILITY_BILL`, and `PENSION_CERTIFICATE` (EPFO / NPS life-certificate intimation).
- **Clinical Anti-Hallucination Guardrails**: If handwriting or dosage is illegible/ambiguous, the engine flags the item (`confidenceScore < 0.60`) for human review without guessing.
- **Honest Confidence (Task 2.4)**: A missing or out-of-range score is recorded as `0.0` and forced through the clinical gate. The engine never invents a plausible-looking percentage, because a fabricated high score would defeat the human-verification safeguard entirely.
- **Extraction Diff (Task 2.5)**: The frontend freezes the machine reading as an immutable `extracted` snapshot so the child's corrections are always diffable against it. See `src/utils/extractionDiff.ts`.
- **Dual-Stack Integration**:
  - **Node.js / Express**: Integrated natively inside `backend/src/ocrService.js` on port `4000` (`POST /api/ocr/extract`).
  - **Python / FastAPI**: Standalone microservice in `ocr_service/` on port `8000` with strict Pydantic v2 validation.
- **100% Offline Safety**: Grounded heuristic engine ensures zero runtime crashes when working offline.

---

## 🔒 Locked Demo Document

`docs/demo_scenario.md` (§2, Step 1) is the **locked judging script**. The default
prescription path in `extractor.get_grounded_fallback` is pinned to it:

| Field | Locked value |
| :--- | :--- |
| Doctor | Dr. S. K. Verma, M.D. (Cardiologist, Exhibition Road, Patna) |
| Patient | Ramakant Mishra, 72 / Male, Kankarbagh, Patna |
| Medicine 1 | Tab Telmisartan **40 mg**, OD, `08:00 AM` |
| Medicine 2 | Tab Amlodipine **5 mg**, OD, `08:00 PM` |
| Stock | ~4 days remaining (triggers the refill threshold) |

> ⚠️ Changing the molecules, strengths or trigger slots in the default branch breaks
> the live demo script. If the scenario changes, update `docs/demo_scenario.md`,
> `ocr_service/samples/dr_verma_prescription_pmch.png`, and `src/data/mockData.ts`
> (`INITIAL_DOCUMENTS[0]`) together.

---

## 🧪 Sample Documents & Test Suite (Tasks 0.7 / 2.6)

The three sample documents required by Task 0.7 live in `ocr_service/samples/` and
are generated deterministically:

```bash
cd ocr_service
.venv/bin/python make_samples.py       # regenerate the PNGs
.venv/bin/python -m unittest test_ocr  # 14 tests
```

| Sample | Document class |
| :--- | :--- |
| `dr_verma_prescription_pmch.png` | `PRESCRIPTION` (the locked demo document) |
| `sbpdcl_patna_electric_bill.png` | `ELECTRICITY_BILL` |
| `epfo_life_certificate_notice.png` | `PENSION_CERTIFICATE` |

`TestSampleDocumentExtraction` feeds the real PNGs through the actual pipeline, so
Task 3.4t ("re-run OCR extraction on the final demo documents") is a repeatable command
rather than a manual ritual.

---

## 🚀 Running the Python FastAPI Service
```bash
cd ocr_service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 📡 API Contract

### `POST /api/ocr/extract`
**Request**: `multipart/form-data` with `file` OR `application/json` with `base64Image`.

**Response Schema**:
```json
{
  "documentId": "doc_rx_99201",
  "documentType": "PRESCRIPTION",
  "patientOrConsumerName": "Ramakant Mishra",
  "issuer": {
    "title": "Dr. S. K. Verma, M.D.",
    "subtitle": "Consultant Physician & Cardiologist",
    "address": "Exhibition Road Chauraha, Patna - 800001",
    "regOrConsumer": "BCMR/2004/4891"
  },
  "consultDate": "24-Sep-2026",
  "vitalsOrSummary": "BP: 148/92 • Refill due in 4 days",
  "extractedItems": [
    {
      "id": "med_1",
      "name": "Tab Telmisartan",
      "strength": "40 mg",
      "category": "Cardio",
      "frequency": "Once Daily (Morning)",
      "frequencyCode": "OD",
      "triggerSlot": "08:00 AM",
      "instructions": "1 tablet every morning after breakfast for blood pressure control",
      "refillDays": 4,
      "confidenceScore": 0.98,
      "boundingBox": [360, 120, 430, 880]
    },
    {
      "id": "med_2",
      "name": "Tab Amlodipine",
      "strength": "5 mg",
      "category": "Cardio",
      "frequency": "Once Daily (Evening)",
      "frequencyCode": "OD",
      "triggerSlot": "08:00 PM",
      "instructions": "1 tablet every evening after dinner for blood pressure control",
      "refillDays": 4,
      "confidenceScore": 0.98,
      "boundingBox": [450, 120, 520, 880]
    }
  ],
  "requiresChildVerification": true,
  "guardrailAudit": {
    "dosageAltered": false,
    "unverifiedMedicinesDetected": 0,
    "status": "PASSED_CLINICAL_GATE"
  }
}
```

### `frequencyCode` values
`OD` · `BD` · `TDS` · `HS` · `SOS` · `QWK` · `QID` · `MONTHLY` (bills) · `ONE_OFF` (pension deadlines)

> `Once Daily (Evening)` is normalized **before** the generic `OD` rule, because the
> string contains "once daily" and would otherwise be silently rescheduled to 08:00 AM.

