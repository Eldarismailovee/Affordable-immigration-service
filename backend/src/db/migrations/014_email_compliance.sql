-- Marketing / email compliance: suppression list and user consent flags.

CREATE TABLE IF NOT EXISTS email_suppressions (
  id UUID PRIMARY KEY,
  email_normalized TEXT NOT NULL,
  email_hash TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'unsubscribe',
    'admin_suppressed',
    'bounce',
    'complaint',
    'ccpa_opt_out',
    'consent_withdrawn',
    'gpc'
  )),
  source TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'marketing' CHECK (scope IN (
    'marketing',
    'newsletter',
    'all_non_transactional'
  )),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  token_hash TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS email_suppressions_email_hash_scope_uidx
  ON email_suppressions (email_hash, scope);

CREATE INDEX IF NOT EXISTS email_suppressions_user_id_idx
  ON email_suppressions (user_id)
  WHERE user_id IS NOT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS newsletter_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_consent_source TEXT,
  ADD COLUMN IF NOT EXISTS marketing_opt_out_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_opt_out_reason TEXT;
