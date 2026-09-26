-- =============================================================
-- SaharaSetu — Phase 1 Postgres Schema (Task 3.1)
-- Run: psql -U postgres -d saharasetu -f migrations/001_init.sql
-- =============================================================

-- 1. USERS (parents & children)
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('parent', 'child', 'admin')),
  phone         TEXT UNIQUE NOT NULL,
  language      TEXT NOT NULL DEFAULT 'hi',   -- hi, bho, mai
  city          TEXT,
  address       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. VENDORS (chemist / gas agency)
CREATE TABLE IF NOT EXISTS vendors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  vendor_type   TEXT NOT NULL CHECK (vendor_type IN ('chemist', 'lpg', 'electricity')),
  name          TEXT NOT NULL,
  phone         TEXT,
  area          TEXT,
  consumer_no   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TASKS (core state machine table)
CREATE TABLE IF NOT EXISTS tasks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  task_type           TEXT NOT NULL CHECK (task_type IN ('medicine_order', 'gas_booking', 'checkin', 'utility_payment')),
  title               TEXT NOT NULL,
  description         TEXT,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','awaiting_call','awaiting_approval','done','couldnt_complete')),
  due_date            TIMESTAMPTZ,
  confidence_score    FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
  amount              NUMERIC(10,2),             -- payment amount if applicable
  vendor_id           UUID REFERENCES vendors(id),
  source_document_id  UUID,                      -- FK to documents table (added below)
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CALLS
CREATE TABLE IF NOT EXISTS calls (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         UUID REFERENCES tasks(id) ON DELETE SET NULL,
  parent_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  call_sid        TEXT,                          -- Exotel/Twilio call SID
  direction       TEXT DEFAULT 'outbound',
  status          TEXT CHECK (status IN ('initiated','ringing','answered','completed','no_answer','failed')),
  duration_secs   INT,
  transcript      TEXT,
  sentiment       TEXT CHECK (sentiment IN ('Normal','Positive','Distress','Uncertain')),
  distress_flag   BOOLEAN DEFAULT FALSE,
  retry_count     INT DEFAULT 0,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ACTION LOG (immutable audit trail — Task 3.7)
CREATE TABLE IF NOT EXISTS action_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID REFERENCES tasks(id) ON DELETE SET NULL,
  call_id     UUID REFERENCES calls(id) ON DELETE SET NULL,
  actor       TEXT NOT NULL,   -- 'planner', 'voice_agent', 'action_taker', 'parent', 'guardrail'
  action      TEXT NOT NULL,   -- 'call_initiated', 'task_approved', 'payment_blocked', etc.
  result      TEXT NOT NULL,   -- 'success', 'blocked', 'failed_no_answer', etc.
  payload     JSONB,           -- full context (call outcome, amounts, whatsapp message, etc.)
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. DOCUMENTS (for OCR pipeline output from Track B)
CREATE TABLE IF NOT EXISTS documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  file_name       TEXT NOT NULL,
  doc_type        TEXT CHECK (doc_type IN ('PRESCRIPTION','ELECTRICITY_BILL','PENSION_CERTIFICATE')),
  extracted_items JSONB,        -- structured JSON from Track B OCR pipeline
  raw_ocr_text    TEXT,
  issuer          JSONB,
  status          TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review','approved','rejected')),
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Add FK back to tasks from documents (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_tasks_document'
  ) THEN
    ALTER TABLE tasks
      ADD CONSTRAINT fk_tasks_document
      FOREIGN KEY (source_document_id) REFERENCES documents(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 8. Auto-update updated_at on tasks
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tasks_updated_at'
  ) THEN
    CREATE TRIGGER tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- 9. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_status        ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_parent        ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due           ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_action_log_task     ON action_log(task_id);
CREATE INDEX IF NOT EXISTS idx_calls_task          ON calls(task_id);
CREATE INDEX IF NOT EXISTS idx_calls_distress      ON calls(distress_flag) WHERE distress_flag = TRUE;
