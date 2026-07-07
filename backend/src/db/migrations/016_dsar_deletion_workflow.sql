-- DSAR deletion workflow: processing/failed states and verification metadata.

ALTER TABLE dsar_requests DROP CONSTRAINT IF EXISTS dsar_requests_status_check;

ALTER TABLE dsar_requests
  ADD CONSTRAINT dsar_requests_status_check CHECK (status IN (
    'submitted',
    'identity_verification_required',
    'identity_verified',
    'in_review',
    'action_required',
    'processing',
    'partially_completed',
    'completed',
    'failed',
    'blocked_by_legal_hold',
    'denied',
    'cancelled'
  ));

ALTER TABLE dsar_requests
  ADD COLUMN IF NOT EXISTS deletion_failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS deletion_verification_json JSONB;

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
    'deletion_processing',
    'deletion_verified',
    'deletion_failed',
    'deletion_partial',
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
