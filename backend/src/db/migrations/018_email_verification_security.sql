-- AUTH-003: hardened email verification tokens and pending email change flow.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pending_email TEXT,
  ADD COLUMN IF NOT EXISTS pending_email_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_changed_at TIMESTAMPTZ;

ALTER TABLE email_verification_tokens
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'registration',
  ADD COLUMN IF NOT EXISTS invalidated_at TIMESTAMPTZ;

UPDATE email_verification_tokens
SET
  email = COALESCE(
    email,
    (SELECT u.email FROM users u WHERE u.id = email_verification_tokens.user_id)
  ),
  purpose = COALESCE(purpose, 'registration')
WHERE email IS NULL;

ALTER TABLE email_verification_tokens
  ALTER COLUMN email SET NOT NULL;

ALTER TABLE email_verification_tokens
  DROP CONSTRAINT IF EXISTS email_verification_tokens_purpose_check;

ALTER TABLE email_verification_tokens
  ADD CONSTRAINT email_verification_tokens_purpose_check
  CHECK (purpose IN ('registration', 'resend', 'email_change'));

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_active
  ON email_verification_tokens (user_id, purpose)
  WHERE consumed_at IS NULL
    AND invalidated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_email
  ON email_verification_tokens (LOWER(email));

CREATE INDEX IF NOT EXISTS idx_users_pending_email
  ON users (LOWER(pending_email))
  WHERE pending_email IS NOT NULL;
