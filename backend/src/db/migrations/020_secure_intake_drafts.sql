-- Secure server-side intake drafts (DATA-001 remediation)
-- One active draft per user; PII stored only server-side with expiration.

CREATE TABLE IF NOT EXISTS intake_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  schema_version INTEGER NOT NULL DEFAULT 1,
  version INTEGER NOT NULL DEFAULT 1,
  draft_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  submitted_at TIMESTAMPTZ,
  CONSTRAINT intake_drafts_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_intake_drafts_expires_at
  ON intake_drafts (expires_at)
  WHERE submitted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_intake_drafts_user_id
  ON intake_drafts (user_id);

COMMENT ON TABLE intake_drafts IS 'Server-side intake form drafts; included in DSAR deletion workflow';
