-- Additive, idempotent Brain-source provenance support.
-- Apply explicitly to Neon ASHWOOD Brain / ashwood_brain after review.
-- NEVER execute this migration from a web request or against Dispatch.
BEGIN;
ALTER TABLE brain.notes ADD COLUMN IF NOT EXISTS source_key text;
ALTER TABLE brain.notes ADD COLUMN IF NOT EXISTS source_fingerprint text;
CREATE UNIQUE INDEX IF NOT EXISTS brain_notes_owner_source_key
  ON brain.notes (owner_key, source_key)
  WHERE source_key IS NOT NULL;
COMMIT;
