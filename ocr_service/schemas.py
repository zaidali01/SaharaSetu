"""
Pydantic v2 Output Schemas for Document Intelligence & Vision OCR Engine (Track B)
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class IssuerInfo(BaseModel):
    title: str = Field(..., description="Doctor or Organization Title, e.g. 'Dr. S. K. Verma, M.D.'")
    subtitle: str = Field(..., description="Specialization or Dept, e.g. 'Consultant Physician & Cardiologist'")
    address: str = Field(..., description="Physical Clinic / Billing Address")
    regOrConsumer: str = Field(..., description="Medical Registration No. or Utility Consumer ID")

class ExtractedMedicineItem(BaseModel):
    id: str = Field(..., description="Unique entity identifier")
    name: str = Field(..., description="Brand / Generic medicine name, e.g. 'Tab Amlodipine'")
    strength: str = Field(..., description="Dosage strength, e.g. '5mg' or '500mg'")
    category: Literal["Cardio", "Diabetes", "Lipid", "Thyroid", "Supplement", "General", "Utility"] = Field(
        default="General", description="Clinical category"
    )
    frequency: str = Field(
        ..., description="Standard human readable frequency, e.g. 'Once Daily (Morning)'"
    )
    frequencyCode: Optional[Literal["OD", "BD", "HS", "TDS", "SOS"]] = Field(
        default="OD", description="Standard prescription code"
    )
    triggerSlot: str = Field(..., description="Normalized scheduled time slot, e.g. '08:00 AM'")
    instructions: str = Field(..., description="Instruction for administration")
    refillDays: int = Field(default=30, description="Estimated days of supply")
    confidenceScore: float = Field(..., ge=0.0, le=1.0, description="OCR confidence from 0.0 to 1.0")
    boundingBox: List[int] = Field(
        default=[0, 0, 0, 0],
        description="Normalized pixel bounding box [ymin, xmin, ymax, xmax] scaled 0 to 1000"
    )
    rawOcrText: Optional[str] = Field(default="", description="Exact transcription from image")

class GuardrailAudit(BaseModel):
    dosageAltered: bool = Field(default=False, description="Strict invariant: dosage must not be modified")
    unverifiedMedicinesDetected: int = Field(default=0, description="Count of items with confidence < 0.60")
    status: Literal["PASSED_CLINICAL_GATE", "FLAGGED_FOR_HUMAN_REVIEW"] = Field(
        default="PASSED_CLINICAL_GATE", description="Audit outcome"
    )

class DocumentExtractionResponse(BaseModel):
    documentId: str = Field(..., description="Generated document record UUID")
    documentType: Literal["PRESCRIPTION", "UTILITY_BILL", "PENSION_FORM"] = Field(
        default="PRESCRIPTION", description="Classification of the intake document"
    )
    patientOrConsumerName: str = Field(..., description="Patient or Bill Consumer name")
    issuer: IssuerInfo
    consultDate: str = Field(..., description="Date of consult or bill issue")
    vitalsOrSummary: str = Field(..., description="Extracted vitals or tariff summary")
    extractedItems: List[ExtractedMedicineItem]
    requiresChildVerification: bool = Field(
        default=True, description="Strict safety rule: must be verified by child before autonomous dispatch"
    )
    guardrailAudit: GuardrailAudit
