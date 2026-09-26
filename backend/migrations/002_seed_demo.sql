-- =============================================================
-- SaharaSetu — Demo seed data (Task 0.7 / 0.3)
-- Persona + vendors taken verbatim from docs/demo_scenario.md
--
-- NOTE: the parent phone below is a PLACEHOLDER. Replace it with
-- the real feature phone number before the live on-stage call.
-- =============================================================

-- ── Child (the dashboard user) ───────────────────────────────
INSERT INTO users (name, role, phone, language, city, address)
VALUES ('Priya Mishra', 'child', '+919000000002', 'en', 'Bengaluru', 'Koramangala, Bengaluru, Karnataka')
ON CONFLICT (phone) DO NOTHING;

-- ── Parent (the call recipient) ──────────────────────────────
INSERT INTO users (name, role, phone, language, city, address)
VALUES ('Ramakant Mishra', 'parent', '+919000000001', 'hi', 'Patna', 'Kankarbagh, Patna, Bihar - 800001')
ON CONFLICT (phone) DO NOTHING;

-- ── Vendors, bound to the parent via subquery on phone ───────
-- (parent_id is a UUID, so resolve it by the unique phone rather
--  than hardcoding a literal that would drift between environments)

INSERT INTO vendors (parent_id, vendor_type, name, phone, area, consumer_no)
SELECT u.id, 'chemist', 'Sharma Medical Hall', '+919835012345', 'Kankarbagh Main Rd, Patna', NULL
FROM users u
WHERE u.phone = '+919000000001'
  AND NOT EXISTS (
    SELECT 1 FROM vendors v WHERE v.parent_id = u.id AND v.vendor_type = 'chemist'
  );

INSERT INTO vendors (parent_id, vendor_type, name, phone, area, consumer_no)
SELECT u.id, 'lpg', 'HP Gas Service', '+919835012346', 'Kankarbagh, Patna', 'HP-PAT-88219'
FROM users u
WHERE u.phone = '+919000000001'
  AND NOT EXISTS (
    SELECT 1 FROM vendors v WHERE v.parent_id = u.id AND v.vendor_type = 'lpg'
  );

INSERT INTO vendors (parent_id, vendor_type, name, phone, area, consumer_no)
SELECT u.id, 'electricity', 'SBPDCL', NULL, 'Patna', 'SB-987654'
FROM users u
WHERE u.phone = '+919000000001'
  AND NOT EXISTS (
    SELECT 1 FROM vendors v WHERE v.parent_id = u.id AND v.vendor_type = 'electricity'
  );
