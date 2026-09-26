# Document Intelligence & Vision OCR Engine (Track B / Role 2)

End-to-end multimodal document intake & schedule extraction engine for doctor prescriptions and utility bills in the **Sahay AI (सहाय)** eldercare ecosystem.

---

## 🌟 Key Features
- **Multimodal Gemini 2.0 / 1.5 Flash Vision Extraction**: Extracts structured clinical medicine regimens, normalized recurrence frequencies, 24h trigger time slots, and pixel-relative bounding box overlays (`[ymin, xmin, ymax, xmax]` normalized to 0–1000).
- **Clinical Anti-Hallucination Guardrails**: If handwriting or dosage is illegible/ambiguous, the engine flags the item (`confidenceScore < 0.60`) for human review without guessing.
- **Dual-Stack Integration**:
  - **Node.js / Express**: Integrated natively inside `backend/src/ocrService.js` on port `4000` (`POST /api/ocr/extract`).
  - **Python / FastAPI**: Standalone microservice in `ocr_service/` on port `8000` with strict Pydantic v2 validation.
- **100% Offline Safety**: Grounded heuristic engine ensures zero runtime crashes when working offline.

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
  "patientOrConsumerName": "Ramprasad Atri",
  "issuer": {
    "title": "Dr. S. K. Verma, M.D.",
    "subtitle": "Consultant Physician & Cardiologist",
    "address": "Exhibition Road Chauraha, Patna - 800001",
    "regOrConsumer": "BCMR/2004/4891"
  },
  "consultDate": "2026-09-24",
  "vitalsOrSummary": "BP: 128/82, Fasting: 114 mg/dL",
  "extractedItems": [
    {
      "id": "med_1",
      "name": "Tab Amlodipine",
      "strength": "5mg",
      "category": "Cardio",
      "frequency": "Once Daily (Morning)",
      "frequencyCode": "OD",
      "triggerSlot": "08:00 AM",
      "instructions": "1 tablet after breakfast",
      "refillDays": 30,
      "confidenceScore": 0.98,
      "boundingBox": [360, 120, 430, 880]
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
