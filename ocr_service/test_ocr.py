"""
Track B: Document Intelligence & Vision OCR - Automated Test Suite
Validates Pydantic v2 Schemas, Fallback Heuristics, Frequency Normalization, and Clinical Guardrails.
"""

import unittest
import base64
from schemas import DocumentExtractionResponse, ExtractedMedicineItem, IssuerInfo, GuardrailAudit
from extractor import (
    get_grounded_fallback,
    normalize_frequency_slot,
    extract_from_base64
)

class TestTrackBOcrService(unittest.TestCase):

    def test_dr_verma_cardio_fallback(self):
        """Test default cardiology prescription fallback (Dr. S. K. Verma)."""
        doc = get_grounded_fallback("dr_verma_pmch.pdf", "Ramprasad Atri")
        self.assertEqual(doc.documentType, "PRESCRIPTION")
        self.assertEqual(doc.patientOrConsumerName, "Ramprasad Atri")
        self.assertIn("Verma", doc.issuer.title)
        self.assertGreaterEqual(len(doc.extractedItems), 4)

        # Invariant checks:
        med_names = [m.name for m in doc.extractedItems]
        self.assertTrue(any("Amlodipine" in n for n in med_names))
        self.assertTrue(any("Metformin" in n for n in med_names))
        self.assertTrue(any("Atorvastatin" in n for n in med_names))

        # Clinical guardrail invariant
        self.assertTrue(doc.requiresChildVerification)
        self.assertEqual(doc.guardrailAudit.status, "PASSED_CLINICAL_GATE")
        self.assertEqual(doc.guardrailAudit.unverifiedMedicinesDetected, 0)
        self.assertFalse(doc.guardrailAudit.dosageAltered)

    def test_utility_bill_fallback(self):
        """Test electricity utility bill extraction heuristic (SBPDCL Patna)."""
        doc = get_grounded_fallback("sbpdcl_bill_patna.pdf", "Ramprasad Atri")
        self.assertEqual(doc.documentType, "ELECTRICITY_BILL")
        self.assertIn("SBPDCL", doc.issuer.title)
        self.assertGreaterEqual(len(doc.extractedItems), 2)
        
        # Invariant check: Energy charge and fixed demand
        item_names = [m.name for m in doc.extractedItems]
        self.assertTrue(any("Energy" in n for n in item_names))
        self.assertTrue(any("Demand" in n for n in item_names))

    def test_orthopedic_fallback(self):
        """Test orthopedic prescription fallback (Dr. Anita Roy)."""
        doc = get_grounded_fallback("dr_roy_ortho_knee.pdf", "Ramprasad Atri")
        self.assertEqual(doc.documentType, "PRESCRIPTION")
        self.assertIn("Roy", doc.issuer.title)
        item_names = [m.name for m in doc.extractedItems]
        self.assertTrue(any("Glucosamine" in n for n in item_names))
        self.assertTrue(any("Etoricoxib" in n for n in item_names))
        self.assertTrue(any("Calcirol" in n for n in item_names))

    def test_endocrinology_fallback(self):
        """Test endocrinology prescription fallback (Dr. Manisha Sinha / Shanti Devi)."""
        doc = get_grounded_fallback("dr_sinha_shanti_thyroid.pdf", "Shanti Devi")
        self.assertEqual(doc.documentType, "PRESCRIPTION")
        self.assertEqual(doc.patientOrConsumerName, "Shanti Devi")
        self.assertIn("Sinha", doc.issuer.title)
        item_names = [m.name for m in doc.extractedItems]
        self.assertTrue(any("Thyronorm" in n for n in item_names))
        self.assertTrue(any("Telmisartan" in n for n in item_names))

    def test_frequency_normalizer(self):
        """Test medical frequency normalization to clinical trigger slots."""
        od = normalize_frequency_slot("OD - Once daily morn")
        self.assertEqual(od["frequencyCode"], "OD")
        self.assertEqual(od["triggerSlot"], "08:00 AM")

        bd = normalize_frequency_slot("1-0-1 bd post meals")
        self.assertEqual(bd["frequencyCode"], "BD")
        self.assertEqual(bd["triggerSlot"], "08:30 AM & 08:30 PM")

        hs = normalize_frequency_slot("HS at bedtime")
        self.assertEqual(hs["frequencyCode"], "HS")
        self.assertEqual(hs["triggerSlot"], "10:00 PM")

        sos = normalize_frequency_slot("SOS acute pain only")
        self.assertEqual(sos["frequencyCode"], "SOS")
        self.assertEqual(sos["triggerSlot"], "As Needed")

        qwk = normalize_frequency_slot("Once weekly on sunday")
        self.assertEqual(qwk["frequencyCode"], "QWK")
        self.assertEqual(qwk["triggerSlot"], "Every Sunday 09:00 AM")

    def test_bounding_box_coordinates(self):
        """Test that bounding box coordinates conform to [ymin, xmin, ymax, xmax] 0-1000 scale."""
        doc = get_grounded_fallback("dr_verma.pdf", "Ramprasad Atri")
        for item in doc.extractedItems:
            self.assertEqual(len(item.boundingBox), 4)
            ymin, xmin, ymax, xmax = item.boundingBox
            self.assertGreaterEqual(ymin, 0)
            self.assertLessEqual(ymax, 1000)
            self.assertGreaterEqual(xmin, 0)
            self.assertLessEqual(xmax, 1000)
            self.assertGreater(ymax, ymin)
            self.assertGreater(xmax, xmin)

    def test_base64_payload_handling(self):
        """Test base64 extraction flow."""
        fake_b64 = base64.b64encode(b"dummy image content").decode("utf-8")
        doc = extract_from_base64(fake_b64, "sample_rx.pdf", "Ramprasad Atri")
        self.assertIsInstance(doc, DocumentExtractionResponse)
        self.assertEqual(doc.patientOrConsumerName, "Ramprasad Atri")

if __name__ == "__main__":
    unittest.main()
