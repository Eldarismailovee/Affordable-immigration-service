-- DSAR / privacy rights requests and lifecycle events.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS processing_restricted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_restriction_reason TEXT;

CREATE TABLE IF NOT EXISTS dsar_requests (
  id UUID PRIMARY KEY,
  requester_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requester_email TEXT NOT NULL,
  request_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  identity_verification_status TEXT NOT NULL DEFAULT 'pending',
  identity_verified_at TIMESTAMPTZ,
  identity_verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  legal_hold BOOLEAN NOT NULL DEFAULT FALSE,
  legal_hold_reason TEXT,
  legal_hold_applied_by UUID REFERENCES users(id) ON DELETE SET NULL,
  legal_hold_applied_at TIMESTAMPTZ,
  admin_notes TEXT,
  user_message TEXT,
  requested_changes JSONB,
  export_payload_json JSONB,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  ALTER TABLE dsar_requests
    ADD CONSTRAINT dsar_requests_request_type_check CHECK (request_type IN (
      'export', 'correction', 'deletion', 'anonymization', 'restriction'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE dsar_requests
    ADD CONSTRAINT dsar_requests_status_check CHECK (status IN (
      'submitted',
      'identity_verification_required',
      'identity_verified',
      'in_review',
      'action_required',
      'completed',
      'denied',
      'cancelled'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE dsar_requests
    ADD CONSTRAINT dsar_requests_identity_verification_status_check CHECK (
      identity_verification_status IN ('pending', 'verified', 'failed', 'not_required')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS dsar_request_events (
  id UUID PRIMARY KEY,
  dsar_request_id UUID NOT NULL REFERENCES dsar_requests(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  ALTER TABLE dsar_request_events
    ADD CONSTRAINT dsar_request_events_event_type_check CHECK (event_type IN (
      'submitted',
      'identity_verification_requested',
      'identity_verified',
      'identity_failed',
      'export_generated',
      'correction_applied',
      'anonymization_applied',
      'restriction_applied',
      'legal_hold_applied',
      'legal_hold_removed',
      'denied',
      'completed',
      'cancelled',
      'admin_note_added'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_dsar_requests_requester ON dsar_requests(requester_user_id);
CREATE INDEX IF NOT EXISTS idx_dsar_requests_status ON dsar_requests(status);
CREATE INDEX IF NOT EXISTS idx_dsar_requests_created ON dsar_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dsar_request_events_request ON dsar_request_events(dsar_request_id);
CREATE INDEX IF NOT EXISTS idx_dsar_request_events_created ON dsar_request_events(created_at DESC);

DROP TRIGGER IF EXISTS dsar_requests_set_updated_at ON dsar_requests;
CREATE TRIGGER dsar_requests_set_updated_at
  BEFORE UPDATE ON dsar_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
