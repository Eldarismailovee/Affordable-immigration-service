-- Security/compliance audit trail (distinct from admin_audit_log HTTP action log).

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('success', 'failure')),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_role TEXT,
  target_type TEXT,
  target_id TEXT,
  request_id TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  reason_code TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor_user_id ON audit_events (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_target ON audit_events (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_event_type ON audit_events (event_type);
