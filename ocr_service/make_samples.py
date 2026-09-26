"""
Task 0.7 — Sample document generator for the extraction demo / test suite.

Produces the three document classes named in the Workflow PDF (Task 0.7):
  1. a doctor prescription        -> dr_verma_prescription_pmch.png
  2. an electricity bill          -> sbpdcl_patna_electric_bill.png
  3. a pension life certificate   -> epfo_life_certificate_notice.png

The prescription is the locked judging demo document (docs/demo_scenario.md §2 Step 1),
so its molecules and strengths must stay in sync with that script and with
`extractor.get_grounded_fallback`.

Deterministic output: no randomness, so regeneration is byte-stable for diffing.
"""

import os
from PIL import Image, ImageDraw, ImageFont

SAMPLES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "samples")

W, H = 1000, 1400
PAGE = (250, 248, 244)
INK = (28, 26, 24)
MUTED = (110, 105, 98)
RULE = (205, 198, 188)
ACCENT = (150, 58, 42)

_FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
]
_FONT_BOLD_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]


def _load_font(candidates, size):
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def _fonts():
    return (
        _load_font(_FONT_CANDIDATES, 30),
        _load_font(_FONT_CANDIDATES, 22),
        _load_font(_FONT_BOLD_CANDIDATES, 30),
        _load_font(_FONT_BOLD_CANDIDATES, 18),
    )


def _new_page():
    img = Image.new("RGB", (W, H), PAGE)
    return img, ImageDraw.Draw(img)


def _rule(draw, y, f_body, x0=70, x1=W - 70, color=RULE, width=2):
    draw.line([(x0, y), (x1, y)], fill=color, width=width)


def _text(draw, xy, s, font, fill=INK):
    draw.text(xy, s, font=font, fill=fill)


def render_prescription():
    """Locked demo document: Dr. S. K. Verma, Telmisartan 40mg + Amlodipine 5mg."""
    img, d = _new_page()
    f_h1, f_body, f_bold, f_small = _fonts()

    _text(d, (70, 70), "DR. S. K. VERMA, M.D.", f_h1, INK)
    _text(d, (70, 112), "Consultant Physician & Cardiologist", f_body, MUTED)
    _text(d, (70, 144), "Exhibition Road Chouraha, Patna - 800001", f_body, MUTED)
    _text(d, (70, 176), "Reg. No. BCMR / 2004 / 4891", f_body, MUTED)
    _rule(d, 220, f_body)

    _text(d, (70, 240), "Name: Ramakant Mishra", f_bold, INK)
    _text(d, (70, 274), "Age / Sex: 72 / Male", f_body, INK)
    _text(d, (70, 308), "Address: Kankarbagh, Patna, Bihar - 800020", f_body, INK)
    _text(d, (70, 342), "Date: 24-Sep-2026", f_body, INK)
    _rule(d, 386, f_body)

    _text(d, (70, 410), "Rx", f_h1, ACCENT)
    _rule(d, 452, f_body)

    y = 480
    for line in [
        "1. Tab. Telmisartan 40mg  OD (1-0-0)  (Morn PC)",
        "2. Tab. Amlodipine 5mg  OD (0-0-1)  (Night PC)",
    ]:
        _text(d, (70, y), line, f_body, INK)
        y += 46
    y += 20

    _text(d, (70, y), "Advice:", f_bold, INK)
    y += 36
    for line in [
        "Low salt diet. Walk 30 minutes daily.",
        "Monitor BP every morning and evening.",
        "Refill before the strip finishes.",
    ]:
        _text(d, (70, y), "- " + line, f_body, MUTED)
        y += 36

    _rule(d, H - 220, f_body)
    _text(d, (70, H - 200), "BP: 148/92", f_bold, INK)
    _text(d, (70, H - 168), "Next review: 08-Oct-2026", f_body, MUTED)

    _text(d, (70, H - 100), "Signature", f_body, MUTED)
    _text(d, (70, H - 72), "Dr. S. K. Verma", f_bold, INK)

    path = os.path.join(SAMPLES_DIR, "dr_verma_prescription_pmch.png")
    img.save(path, "PNG", optimize=True)
    return path


def render_electricity_bill():
    img, d = _new_page()
    f_h1, f_body, f_bold, f_small = _fonts()

    _text(d, (70, 70), "SBPDCL", f_h1, INK)
    _text(d, (70, 112), "South Bihar Power Distribution Company Ltd", f_body, MUTED)
    _text(d, (70, 144), "Vidyut Bhawan, Bailey Road, Patna - 800021", f_body, MUTED)
    _rule(d, 190, f_body)

    _text(d, (70, 210), "ELECTRICITY BILL", f_h1, ACCENT)
    _rule(d, 254, f_body)

    rows = [
        ("Consumer Name", "Ramakant Mishra"),
        ("Consumer No.", "CA-1004892188"),
        ("Connection Type", "Domestic LT (2 kW)"),
        ("Billing Period", "01-Aug-2026 to 31-Aug-2026"),
        ("Bill No. / Date", "SBPDCL/88219 / 15-Sep-2026"),
        ("Due Date", "18-Sep-2026"),
    ]
    y = 280
    for label, value in rows:
        _text(d, (70, y), label, f_body, MUTED)
        _text(d, (400, y), value, f_body, INK)
        y += 40

    _rule(d, y + 10, f_body)
    y += 40

    _text(d, (70, y), "Energy Charge (184 Units @ 6.10)", f_body, INK)
    _text(d, (760, y), "1,122.40", f_body, INK)
    y += 40
    _text(d, (70, y), "Fixed Demand Charge (2 kW @ 80)", f_body, INK)
    _text(d, (760, y), "160.00", f_body, INK)
    y += 40
    _text(d, (70, y), "Electricity Duty & Cess (6%)", f_body, INK)
    _text(d, (760, y), "76.80", f_body, INK)
    y += 40

    _rule(d, y + 10, f_body)
    y += 40
    _text(d, (70, y), "TOTAL AMOUNT DUE", f_bold, INK)
    _text(d, (740, y), "Rs. 1,359.00", f_h1, ACCENT)

    _text(d, (70, H - 140), "Pay via Sahay AI dashboard - approval required.", f_body, MUTED)
    _text(d, (70, H - 110), "This is a computer generated bill.", f_body, MUTED)

    path = os.path.join(SAMPLES_DIR, "sbpdcl_patna_electric_bill.png")
    img.save(path, "PNG", optimize=True)
    return path


def render_pension_notice():
    img, d = _new_page()
    f_h1, f_body, f_bold, f_small = _fonts()

    _text(d, (70, 70), "EPFO", f_h1, INK)
    _text(d, (70, 112), "Employees' Provident Fund Organisation", f_body, MUTED)
    _text(d, (70, 144), "Regional Office, Nicholson Road, Kankarbagh, Patna - 800020", f_body, MUTED)
    _rule(d, 190, f_body)

    _text(d, (70, 210), "LIFE CERTIFICATE INTIMATION", f_h1, ACCENT)
    _rule(d, 254, f_body)

    y = 290
    for label, value in [
        ("Pensioner Name", "Ramakant Mishra"),
        ("PRAN", "MLXY1234567"),
        ("Pension Type", "Vridhi Pension (Old Age)"),
        ("Date of Birth", "14-Aug-1954"),
        ("Notice Date", "12-Sep-2026"),
    ]:
        _text(d, (70, y), label, f_body, MUTED)
        _text(d, (400, y), value, f_body, INK)
        y += 42

    y += 30
    _rule(d, y, f_body)
    y += 40

    for para in [
        "It is hereby intimated that a digitised Life Certificate must be",
        "submitted by the pensioner every year to continue availing pension.",
        "",
        "Last date for submission: 30 November 2026",
        "Pension will be stopped from 01 December 2026 if not received.",
        "",
        "Mandatory attachments: Aadhaar Card and PAN Card.",
        "Biometric age proof is required for Vridhi Pension claimants.",
    ]:
        _text(d, (70, y), para, f_body, INK if "30 November" in para or "Aadhaar" in para else MUTED)
        y += 40

    _text(d, (70, H - 140), "Regional Pension Officer", f_body, MUTED)
    _text(d, (70, H - 110), "EPFO Regional Office, Patna", f_bold, INK)

    path = os.path.join(SAMPLES_DIR, "epfo_life_certificate_notice.png")
    img.save(path, "PNG", optimize=True)
    return path


def render_all():
    os.makedirs(SAMPLES_DIR, exist_ok=True)
    return [render_prescription(), render_electricity_bill(), render_pension_notice()]


if __name__ == "__main__":
    for p in render_all():
        print("wrote", p)
