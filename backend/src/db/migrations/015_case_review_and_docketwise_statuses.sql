-- Case-review intake fields and honest Docketwise integration statuses.

ALTER TABLE intakes
  ADD COLUMN IF NOT EXISTS petition_relationship TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS has_urgent_deadline BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS urgent_deadline_notes TEXT;

ALTER TABLE intakes DROP CONSTRAINT IF EXISTS intakes_docketwise_status_check;

ALTER TABLE intakes
  ADD CONSTRAINT intakes_docketwise_status_check CHECK (
    docketwise_status IN (
      'not_synced',
      'not_configured',
      'pending',
      'processing',
      'synced',
      'failed',
      'error'
    )
  );

ALTER TABLE docketwise_sync DROP CONSTRAINT IF EXISTS docketwise_sync_status_check;

ALTER TABLE docketwise_sync
  ADD CONSTRAINT docketwise_sync_status_check CHECK (
    status IN (
      'not_synced',
      'not_configured',
      'pending',
      'processing',
      'synced',
      'failed',
      'error'
    )
  );
