"""
FastAPI Document Intelligence & Vision OCR Engine (Track B / Role 2)
Port: 8000
"""

import os
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas import DocumentExtractionResponse
from extractor import extract_from_image_bytes, get_grounded_fallback

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
def health_check():
    return {
        "status": "healthy",
        "service": "document_vision_ocr",
        "model": os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
        "gemini_api_key_configured": bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"))
    }

@app.post("/api/ocr/extract", response_model=DocumentExtractionResponse)
async def extract_document(
    file: Optional[UploadFile] = File(None),
    fileName: Optional[str] = Form(None),
    patientName: Optional[str] = Form("Ramprasad Atri")
):
    """
    Extracts structured medicine items, frequency codes, normalized trigger slots,
    and bounding box coordinates from uploaded doctor prescriptions or utility bills.
    """
    try:
        if file:
            content = await file.read()
            return extract_from_image_bytes(
                image_bytes=content,
                file_name=file.filename or fileName or "upload.pdf",
                patient_name=patientName
            )
        
        # Grounded extraction if sample filename requested without file payload
        return get_grounded_fallback(
            file_name=fileName or "dr_verma_prescription_pmch.pdf",
            patient_name=patientName
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
