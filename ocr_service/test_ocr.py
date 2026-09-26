"""
Track B: Document Intelligence & Vision OCR - Automated Test Suite
Covers Tasks 2.1, 2.2, 2.3, 2.4 and 2.6 from the build workflow.

Task 2.6: extraction is exercised against the real sample documents produced by
`make_samples.py` (prescription, electricity bill, pension life certificate), not
only against the filename-keyed fallbacks.
"""

import unittest
import base64
import os
from schemas import DocumentExtractionResponse, ExtractedMedicineItem, IssuerInfo, GuardrailAudit
from extractor import (
    get_grounded_fallback,
    normalize_frequency_slot,
    extract_from_base64,
    extract_from_image_bytes
)

SAMPLES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "samples")
PATIENT = "Ramprasad Atri"


def sample_path(name):
    return os.path.join(SAMPLES_DIR, name)


def has_sample(name):
    return os.path.exists(sample_path(name))


class TestTrackBOcrService(unittest.TestCase):

    def test_dr_verma_cardio_fallback(self):
        """Default cardiology prescription must match the LOCKED demo scenario.

        docs/demo_scenario.md section 2, Step 1 locks the judging demo to
        Telmisartan 40mg (OD morning) + Amlodipine 5mg (OD evening) with roughly
        four days of stock left, so the Planner fires the refill call.
        """
        doc = get_grounded_fallback("dr_verma_pmch.pdf", PATIENT)
        self.assertEqual(doc.documentType, "PRESCRIPTION")
        self.assertEqual(doc.patientOrConsumerName, PATIENT)
        self.assertIn("Verma", doc.issuer.title)

        names = [m.name for m in doc.extractedItems]
        self.assertEqual(len(doc.extractedItems), 2)
        self.assertTrue(any("Telmisartan" in n for n in names), names)
        self.assertTrue(any("Amlodipine" in n for n in names), names)

        telmisartan = next(m for m in doc.extractedItems if "Telmisartan" in m.name)
        amlodipine = next(m for m in doc.extractedItems if "Amlodipine" in m.name)
        self.assertEqual(telmisartan.strength, "40 mg")
        self.assertEqual(telmisartan.triggerSlot, "08:00 AM")
        self.assertEqual(amlodipine.strength, "5 mg")
        self.assertEqual(amlodipine.triggerSlot, "08:00 PM")

        # Four days of stock is what triggers the refill threshold in the demo.
        self.assertEqual(telmisartan.refillDays, 4)
        self.assertEqual(amlodipine.refillDays, 4)

        # Clinical guardrail invariants
        self.assertTrue(doc.requiresChildVerification)
        self.assertEqual(doc.guardrailAudit.status, "PASSED_CLINICAL_GATE")
        self.assertEqual(doc.guardrailAudit.unverifiedMedicinesDetected, 0)
        self.assertFalse(doc.guardrailAudit.dosageAltered)

    def test_utility_bill_fallback(self):
        """Test electricity utility bill extraction heuristic (SBPDCL Patna)."""
        doc = get_grounded_fallback("sbpdcl_bill_patna.pdf", PATIENT)
        self.assertEqual(doc.documentType, "ELECTRICITY_BILL")
        self.assertIn("SBPDCL", doc.issuer.title)
        self.assertGreaterEqual(len(doc.extractedItems), 2)

        item_names = [m.name for m in doc.extractedItems]
        self.assertTrue(any("Energy" in n for n in item_names))
        self.assertTrue(any("Demand" in n for n in item_names))
        for item in doc.extractedItems:
            self.assertEqual(item.frequencyCode, "MONTHLY")

    def test_pension_life_certificate_fallback(self):
        """Task 2.2: pension / life-certificate notices must be a first-class class."""
        doc = get_grounded_fallback("epfo_life_certificate_notice.pdf", PATIENT)
        self.assertEqual(doc.documentType, "PENSION_CERTIFICATE")
        self.assertIn("EPFO", doc.issuer.title)
        self.assertTrue(doc.requiresChildVerification)
        self.assertGreaterEqual(len(doc.extractedItems), 1)

        names = [m.name for m in doc.extractedItems]
        self.assertTrue(any("Life Certificate" in n for n in names), names)
        # The November deadline is the whole point of the flow.
        self.assertTrue(any("30-Nov" in m.triggerSlot for m in doc.extractedItems))
        for item in doc.extractedItems:
            self.assertEqual(item.category, "Pension")
            self.assertEqual(item.frequencyCode, "ONE_OFF")

    def test_orthopedic_fallback(self):
        """Test orthopedic prescription fallback (Dr. Anita Roy)."""
        doc = get_grounded_fallback("dr_roy_ortho_knee.pdf", PATIENT)
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

    def test_non_clinical_frequency_normalizer(self):
        """Task 2.2: bills and pensions need their own recurrence codes."""
        monthly = normalize_frequency_slot("Monthly recurring cycle")
        self.assertEqual(monthly["frequencyCode"], "MONTHLY")

        one_off = normalize_frequency_slot("One-off deadline")
        self.assertEqual(one_off["frequencyCode"], "ONE_OFF")

    def test_bounding_box_coordinates(self):
        """Test that bounding box coordinates conform to [ymin, xmin, ymax, xmax] 0-1000 scale."""
        for name in [
            "dr_verma.pdf",
            "sbpdcl_patna_electric_bill.pdf",
            "epfo_life_certificate_notice.pdf",
            "dr_roy_ortho.pdf",
        ]:
            doc = get_grounded_fallback(name, PATIENT)
            for item in doc.extractedItems:
                self.assertEqual(len(item.boundingBox), 4)
                ymin, xmin, ymax, xmax = item.boundingBox
                self.assertGreaterEqual(ymin, 0)
                self.assertLessEqual(ymax, 1000)
                self.assertGreaterEqual(xmin, 0)
                self.assertLessEqual(xmax, 1000)
                self.assertGreater(ymax, ymin)
                self.assertGreater(xmax, xmin)

    def test_confidence_within_declared_range(self):
        """Task 2.4: every score must be a real 0..1 value, never a fabricated default."""
        for name in [
            "dr_verma.pdf",
            "sbpdcl_patna_electric_bill.pdf",
            "epfo_life_certificate_notice.pdf",
        ]:
            doc = get_grounded_fallback(name, PATIENT)
            for item in doc.extractedItems:
                self.assertGreaterEqual(item.confidenceScore, 0.0)
                self.assertLessEqual(item.confidenceScore, 1.0)

    def test_base64_payload_handling(self):
        """Test base64 extraction flow."""
        fake_b64 = base64.b64encode(b"dummy image content").decode("utf-8")
        doc = extract_from_base64(fake_b64, "sample_rx.pdf", PATIENT)
        self.assertIsInstance(doc, DocumentExtractionResponse)
        self.assertEqual(doc.patientOrConsumerName, PATIENT)


class TestSampleDocumentExtraction(unittest.TestCase):
    """Task 2.6 / 3.4t: run the real pipeline over the Task 0.7 sample documents."""

    def test_prescription_sample_extracts_locked_drugs(self):
        name = "dr_verma_prescription_pmch.png"
        if not has_sample(name):
            self.skipTest("sample missing; run `python make_samples.py`")

        with open(sample_path(name), "rb") as fh:
            doc = extract_from_image_bytes(fh.read(), name, PATIENT)

        self.assertEqual(doc.documentType, "PRESCRIPTION")
        self.assertIn("Verma", doc.issuer.title)
        self.assertGreaterEqual(len(doc.extractedItems), 2)
        self.assertTrue(doc.requiresChildVerification)

        names = " ".join(m.name for m in doc.extractedItems)
        self.assertIn("Telmisartan", names)
        self.assertIn("Amlodipine", names)

    def test_electricity_bill_sample(self):
        name = "sbpdcl_patna_electric_bill.png"
        if not has_sample(name):
            self.skipTest("sample missing; run `python make_samples.py`")

        with open(sample_path(name), "rb") as fh:
            doc = extract_from_image_bytes(fh.read(), name, PATIENT)

        self.assertEqual(doc.documentType, "ELECTRICITY_BILL")
        self.assertGreaterEqual(len(doc.extractedItems), 2)
        for item in doc.extractedItems:
            self.assertEqual(item.frequencyCode, "MONTHLY")

    def test_pension_sample(self):
        name = "epfo_life_certificate_notice.png"
        if not has_sample(name):
            self.skipTest("sample missing; run `python make_samples.py`")

        with open(sample_path(name), "rb") as fh:
            doc = extract_from_image_bytes(fh.read(), name, PATIENT)

        self.assertEqual(doc.documentType, "PENSION_CERTIFICATE")
        self.assertGreaterEqual(len(doc.extractedItems), 1)
        self.assertTrue(any("30-Nov" in m.triggerSlot for m in doc.extractedItems))

    def test_all_samples_produce_valid_schemas(self):
        """Every sample must round-trip through the Pydantic output contract."""
        for name in [
            "dr_verma_prescription_pmch.png",
            "sbpdcl_patna_electric_bill.png",
            "epfo_life_certificate_notice.png",
        ]:
            if not has_sample(name):
                self.skipTest("sample missing; run `python make_samples.py`")
            with open(sample_path(name), "rb") as fh:
                doc = extract_from_image_bytes(fh.read(), name, PATIENT)
            reparsed = DocumentExtractionResponse(**doc.model_dump())
            self.assertEqual(reparsed.documentType, doc.documentType)
            self.assertTrue(reparsed.requiresChildVerification)
            self.assertIn(
                reparsed.guardrailAudit.status,
                {"PASSED_CLINICAL_GATE", "FLAGGED_FOR_HUMAN_REVIEW"},
            )


if __name__ == "__main__":
    unittest.main()
