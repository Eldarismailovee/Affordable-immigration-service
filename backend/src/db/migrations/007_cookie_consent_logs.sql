-- Cookie consent preference change log (GDPR/ePrivacy audit trail).

CREATE TABLE IF NOT EXISTS cookie_consent_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  anonymous_id UUID,
  consent_version TEXT NOT NULL,
  strictly_necessary BOOLEAN NOT NULL DEFAULT TRUE,
  analytics BOOLEAN NOT NULL DEFAULT FALSE,
  marketing BOOLEAN NOT NULL DEFAULT FALSE,
  source TEXT NOT NULL,
  region_hint TEXT,
  user_agent_hash TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  ALTER TABLE cookie_consent_logs
    ADD CONSTRAINT cookie_consent_logs_source_check CHECK (
      source IN ('banner', 'preferences')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE cookie_consent_logs
    ADD CONSTRAINT cookie_consent_logs_strictly_necessary_check CHECK (
      strictly_necessary = TRUE
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_cookie_consent_logs_user ON cookie_consent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_cookie_consent_logs_anonymous ON cookie_consent_logs(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_cookie_consent_logs_created ON cookie_consent_logs(created_at DESC);
