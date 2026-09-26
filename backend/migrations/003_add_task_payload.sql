-- Migration 003: give tasks a structured payload
--
-- Why: backend/src/actionTaker.js:129-131 read `task.payload?.medicine_name`,
-- `task.payload?.quantity` and `task.payload?.delivery_address`, but the tasks
-- table never had a payload column. Every WhatsApp order therefore sent the
-- hardcoded fallbacks ("Prescription Medicines" / "1 month supply" /
-- "Parent Home Address") and the chemist received a meaningless message.
--
-- The payload holds the per-task action arguments that the Action-Taker needs
-- to build an external message. It is deliberately JSONB rather than extra
-- columns because each task_type needs a different shape.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS payload JSONB;

COMMENT ON COLUMN tasks.payload IS
  'Per-task action arguments. medicine_order: {medicine_name, quantity, delivery_address, dosage, frequency, instructions}. gas_booking: {cylinder_type, connection_id}. Populated at task creation; read by the Action-Taker when dispatching.';

-- Backfill any existing medicine_order tasks that were created before this
-- migration, so they pick up the parent's real address instead of the
-- placeholder. Idempotent: rows that already have a payload are left alone.
UPDATE tasks t
SET payload = jsonb_build_object(
        'medicine_name', t.title,
        'quantity',      COALESCE(t.description, '1 month supply'),
        'delivery_address', COALESCE(
          (SELECT u.address FROM users u WHERE u.id = t.parent_id),
          'Parent Home Address'
        )
      )
WHERE t.task_type = 'medicine_order'
  AND (t.payload IS NULL OR t.payload = '{}'::jsonb);
