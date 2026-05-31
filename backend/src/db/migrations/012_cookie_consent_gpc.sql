-- Extend cookie consent logs for Global Privacy Control (GPC) signals.

ALTER TABLE cookie_consent_logs
  ADD COLUMN IF NOT EXISTS gpc_active BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE cookie_consent_logs DROP CONSTRAINT IF EXISTS cookie_consent_logs_source_check;

ALTER TABLE cookie_consent_logs
  ADD CONSTRAINT cookie_consent_logs_source_check CHECK (
    source IN ('banner', 'preferences', 'gpc', 'migration')
  );
