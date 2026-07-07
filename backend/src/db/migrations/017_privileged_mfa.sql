-- Privileged-account MFA: TOTP factors, recovery codes, login challenges, session assurance.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS session_security_version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE auth_refresh_tokens
  ADD COLUMN IF NOT EXISTS mfa_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS session_security_version INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS user_mfa_factors (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  encrypted_secret BYTEA NOT NULL,
  encryption_nonce BYTEA NOT NULL,
  key_version TEXT NOT NULL,
  status TEXT NOT NULL,
  enrolled_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  last_used_timestep BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_mfa_factors_type_check CHECK (type IN ('totp')),
  CONSTRAINT user_mfa_factors_status_check CHECK (status IN ('pending', 'active', 'disabled'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_mfa_factors_one_active_totp
  ON user_mfa_factors(user_id)
  WHERE type = 'totp' AND status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_mfa_factors_one_pending_totp
  ON user_mfa_factors(user_id)
  WHERE type = 'totp' AND status = 'pending';

CREATE INDEX IF NOT EXISTS idx_user_mfa_factors_user
  ON user_mfa_factors(user_id);

CREATE TABLE IF NOT EXISTS user_mfa_recovery_codes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_mfa_recovery_codes_hash
  ON user_mfa_recovery_codes(code_hash);

CREATE INDEX IF NOT EXISTS idx_user_mfa_recovery_codes_user_active
  ON user_mfa_recovery_codes(user_id)
  WHERE used_at IS NULL;

CREATE TABLE IF NOT EXISTS auth_mfa_challenges (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT auth_mfa_challenges_purpose_check CHECK (
    purpose IN ('login', 'enrollment', 'step_up')
  )
);

CREATE INDEX IF NOT EXISTS idx_auth_mfa_challenges_user_active
  ON auth_mfa_challenges(user_id, expires_at)
  WHERE consumed_at IS NULL;
