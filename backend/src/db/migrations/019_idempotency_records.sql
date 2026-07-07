-- Idempotency records for sensitive state-changing commands.

CREATE TABLE IF NOT EXISTS idempotency_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_scope TEXT NOT NULL,
  operation TEXT NOT NULL,
  idempotency_key_hash TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'processing',
  resource_type TEXT,
  resource_id TEXT,
  http_status INTEGER,
  response_body JSONB,
  error_code TEXT,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT idempotency_records_state_check CHECK (
    state IN ('processing', 'completed', 'failed_retryable', 'failed_terminal')
  ),
  CONSTRAINT idempotency_records_scope_operation_key_unique UNIQUE (
    actor_scope,
    operation,
    idempotency_key_hash
  )
);

CREATE INDEX IF NOT EXISTS idempotency_records_expires_at_idx
  ON idempotency_records (expires_at);

CREATE INDEX IF NOT EXISTS idempotency_records_state_locked_at_idx
  ON idempotency_records (state, locked_at)
  WHERE state = 'processing';

CREATE INDEX IF NOT EXISTS idempotency_records_resource_idx
  ON idempotency_records (resource_type, resource_id)
  WHERE resource_id IS NOT NULL;

COMMENT ON TABLE idempotency_records IS
  'Scoped idempotency records for sensitive commands; stores request hash and replayable safe responses only.';

COMMENT ON COLUMN idempotency_records.idempotency_key_hash IS
  'HMAC-SHA256 fingerprint of normalized client Idempotency-Key; raw key is never stored.';

COMMENT ON COLUMN idempotency_records.response_body IS
  'Safe replay payload only; must not contain tokens, secrets, or one-time values.';
