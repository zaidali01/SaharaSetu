"""
FastAPI Document Intelligence & Vision OCR Engine (Track B / Role 2)
Port: 8000
"""

import os
from typing import Optional, Dict, Any
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas import DocumentExtractionResponse, ExtractionRequest
from extractor import (
    extract_from_image_bytes,
    extract_from_base64,
    get_grounded_fallback,
    normalize_frequency_slot
)

app = FastAPI(
    title="Sahay AI — Document Intelligence & Vision OCR Engine",
    version="1.0.0",
    description="Multimodal Prescription & Utility Bill Entity Extraction with Clinical Guardrails for Bihar Eldercare."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
@app.get("/api/ocr/health")
def health_check():
    return {
        "status": "healthy",
        "service": "document_vision_ocr",
        "model": os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
        "gemini_api_key_configured": bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"))
    }

@app.post("/api/ocr/extract", response_model=DocumentExtractionResponse)
async def extract_document(request: Request):
    """
    Polymorphic Document OCR Extraction Endpoint.
    Gracefully accepts:
    1. multipart/form-data with file upload & patientName form fields
    2. application/json with base64Image or sample fileName
    3. Query or empty fallback
    """
    try:
        content_type = request.headers.get("content-type", "").lower()

        # 1. JSON Request Payload
        if "application/json" in content_type:
            try:
                body = await request.json()
            except Exception:
                body = {}
            file_name = body.get("fileName") or "dr_verma_prescription_pmch.pdf"
            patient_name = body.get("patientName") or "Ramprasad Atri"
            base64_image = body.get("base64Image")
            mime_type = body.get("mimeType", "image/jpeg")

            if base64_image:
                return extract_from_base64(
                    base64_str=base64_image,
                    file_name=file_name,
                    patient_name=patient_name,
                    mime_type=mime_type
                )
            return get_grounded_fallback(file_name=file_name, patient_name=patient_name)

        # 2. Multipart / Form Upload
        if "multipart/form-data" in content_type:
            form = await request.form()
            file = form.get("file")
            file_name = form.get("fileName")
            patient_name = form.get("patientName") or "Ramprasad Atri"

            if file and hasattr(file, "read"):
                content = await file.read()
                actual_name = getattr(file, "filename", None) or file_name or "upload.pdf"
                actual_mime = getattr(file, "content_type", "image/jpeg")
                return extract_from_image_bytes(
                    image_bytes=content,
                    file_name=actual_name,
                    patient_name=patient_name,
                    mime_type=actual_mime
                )

            return get_grounded_fallback(
                file_name=str(file_name or "dr_verma_prescription_pmch.pdf"),
                patient_name=str(patient_name)
            )

        # 3. Default fallback
        return get_grounded_fallback(
            file_name="dr_verma_prescription_pmch.pdf",
            patient_name="Ramprasad Atri"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ocr/normalize-frequency")
async def normalize_frequency(request: Request):
    """Utility endpoint to normalize latin medical cadence strings into trigger slots."""
    try:
        body = await request.json()
        raw_text = body.get("rawText", "OD")
        return normalize_frequency_slot(raw_text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
