-- Retention lifecycle fields for automated cleanup/anonymization.
-- TODO: Confirm final retention periods and legal-hold policy with privacy/security/legal counsel before production launch.

ALTER TABLE audit_events
  ADD COLUMN IF NOT EXISTS legal_hold BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS legal_hold_reason TEXT,
  ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_reason TEXT,
  ADD COLUMN IF NOT EXISTS retention_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_anonymization_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retention_override_reason TEXT,
  ADD COLUMN IF NOT EXISTS retention_overridden_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS retention_overridden_at TIMESTAMPTZ;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS legal_hold BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS legal_hold_reason TEXT,
  ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_reason TEXT,
  ADD COLUMN IF NOT EXISTS retention_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_anonymization_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retention_override_reason TEXT,
  ADD COLUMN IF NOT EXISTS retention_overridden_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS retention_overridden_at TIMESTAMPTZ;

ALTER TABLE agreements
  ADD COLUMN IF NOT EXISTS legal_hold BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS legal_hold_reason TEXT,
  ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_reason TEXT,
  ADD COLUMN IF NOT EXISTS retention_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_anonymization_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retention_override_reason TEXT,
  ADD COLUMN IF NOT EXISTS retention_overridden_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS retention_overridden_at TIMESTAMPTZ;

ALTER TABLE onboarding_packets
  ADD COLUMN IF NOT EXISTS legal_hold BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS legal_hold_reason TEXT,
  ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_reason TEXT,
  ADD COLUMN IF NOT EXISTS retention_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_anonymization_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retention_override_reason TEXT,
  ADD COLUMN IF NOT EXISTS retention_overridden_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS retention_overridden_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_audit_events_retention_due
  ON audit_events (retention_until)
  WHERE legal_hold = FALSE AND anonymized_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_retention_due
  ON leads (retention_until)
  WHERE legal_hold = FALSE AND anonymized_at IS NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_agreements_retention_due
  ON agreements (retention_until)
  WHERE legal_hold = FALSE AND anonymized_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_onboarding_packets_retention_due
  ON onboarding_packets (retention_until)
  WHERE legal_hold = FALSE AND anonymized_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_expired
  ON auth_refresh_tokens (expires_at)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_revoked
  ON auth_refresh_tokens (revoked_at)
  WHERE revoked_at IS NOT NULL;
