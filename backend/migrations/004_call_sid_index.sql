-- Migration 004: support provider call SIDs in the audit trail
--
-- Why: the Voice Agent (Track A) reports outcomes with a Twilio CallSid like
-- "CAxxxxxxxx", but action_log.call_id and calls.id are UUID columns. Passing a
-- CallSid as callId made every logAction for that outcome fail its INSERT, so
-- distress flags, dosage holds and approval records were all silently lost.
--
-- calls.call_sid and calls.retry_count already existed for exactly this, so no
-- new column is needed — the Action-Taker just has to resolve a CallSID to the
-- UUID of a calls row. This index makes that lookup cheap.

CREATE INDEX IF NOT EXISTS idx_calls_call_sid ON calls(call_sid);

COMMENT ON COLUMN calls.call_sid IS
  'Provider call identifier (Twilio CallSID). Unique per call; resolved to calls.id so action_log.call_id (a UUID FK) can reference it.';
