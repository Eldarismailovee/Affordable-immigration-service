-- Extend DSAR for public privacy intake, additional rights types, and export PDF metadata.

ALTER TABLE dsar_requests
  ALTER COLUMN requester_user_id DROP NOT NULL;

ALTER TABLE dsar_requests
  ADD COLUMN IF NOT EXISTS denial_reason TEXT,
  ADD COLUMN IF NOT EXISTS export_pdf_path TEXT,
  ADD COLUMN IF NOT EXISTS export_generated_at TIMESTAMPTZ;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS ccpa_sale_opt_out_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ccpa_sale_opt_out_reason TEXT;

-- Replace request_type constraint with expanded rights (keeps legacy aliases).
ALTER TABLE dsar_requests DROP CONSTRAINT IF EXISTS dsar_requests_request_type_check;

ALTER TABLE dsar_requests
  ADD CONSTRAINT dsar_requests_request_type_check CHECK (request_type IN (
    'access',
    'correction',
    'deletion',
    'restriction',
    'portability',
    'objection',
    'ccpa_opt_out',
    'export',
    'anonymization'
  ));

ALTER TABLE dsar_requests DROP CONSTRAINT IF EXISTS dsar_requests_status_check;

ALTER TABLE dsar_requests
  ADD CONSTRAINT dsar_requests_status_check CHECK (status IN (
    'submitted',
    'identity_verification_required',
    'identity_verified',
    'in_review',
    'action_required',
    'partially_completed',
    'completed',
    'denied',
    'cancelled'
  ));

ALTER TABLE dsar_request_events DROP CONSTRAINT IF EXISTS dsar_request_events_event_type_check;

ALTER TABLE dsar_request_events
  ADD CONSTRAINT dsar_request_events_event_type_check CHECK (event_type IN (
    'submitted',
    'identity_verification_requested',
    'identity_verified',
    'identity_failed',
    'export_generated',
    'pdf_generated',
    'correction_applied',
    'anonymization_applied',
    'restriction_applied',
    'portability_exported',
    'objection_submitted',
    'objection_resolved',
    'ccpa_opt_out_recorded',
    'legal_hold_applied',
    'legal_hold_removed',
    'denied',
    'completed',
    'cancelled',
    'admin_note_added',
    'status_changed'
  ));
