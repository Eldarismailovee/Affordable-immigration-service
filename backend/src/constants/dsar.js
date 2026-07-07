/** Canonical GDPR/CCPA privacy request types (stored in dsar_requests.request_type). */
export const PRIVACY_REQUEST_TYPES = {
  ACCESS: "access",
  CORRECTION: "correction",
  DELETION: "deletion",
  RESTRICTION: "restriction",
  PORTABILITY: "portability",
  OBJECTION: "objection",
  CCPA_OPT_OUT: "ccpa_opt_out",
};

/** Legacy aliases accepted on intake; normalized before persistence where possible. */
export const DSAR_LEGACY_REQUEST_TYPES = ["export", "anonymization"];

export const DSAR_REQUEST_TYPES = [
  ...Object.values(PRIVACY_REQUEST_TYPES),
  ...DSAR_LEGACY_REQUEST_TYPES,
];

export const DSAR_STATUSES = [
  "submitted",
  "identity_verification_required",
  "identity_verified",
  "in_review",
  "action_required",
  "processing",
  "partially_completed",
  "completed",
  "failed",
  "blocked_by_legal_hold",
  "denied",
  "cancelled",
];

export const DSAR_IDENTITY_STATUSES = ["pending", "verified", "failed", "not_required"];

export const DSAR_EVENT_TYPES = [
  "submitted",
  "identity_verification_requested",
  "identity_verified",
  "identity_failed",
  "export_generated",
  "pdf_generated",
  "correction_applied",
  "anonymization_applied",
  "deletion_processing",
  "deletion_verified",
  "deletion_failed",
  "deletion_partial",
  "restriction_applied",
  "portability_exported",
  "objection_submitted",
  "objection_resolved",
  "ccpa_opt_out_recorded",
  "legal_hold_applied",
  "legal_hold_removed",
  "denied",
  "completed",
  "cancelled",
  "admin_note_added",
  "status_changed",
];

export const DSAR_EXPORT_REQUEST_TYPES = ["access", "export", "portability"];

export const DSAR_DELETION_REQUEST_TYPES = ["deletion", "anonymization"];

export const DSAR_TYPES_REQUIRING_IDENTITY = [
  "access",
  "export",
  "correction",
  "deletion",
  "anonymization",
  "restriction",
  "portability",
  "objection",
  "ccpa_opt_out",
];

export const DSAR_CORRECTABLE_USER_FIELDS = ["full_name", "fullName", "phone", "address"];

export const DSAR_CORRECTABLE_LEAD_FIELDS = [
  "first_name",
  "firstName",
  "last_name",
  "lastName",
  "phone",
  "email",
];

export const DSAR_FORBIDDEN_CORRECTION_FIELDS = [
  "role",
  "status",
  "password",
  "password_hash",
  "payment",
  "audit",
];

export const DSAR_STATUS_TRANSITIONS = {
  submitted: [
    "identity_verification_required",
    "identity_verified",
    "in_review",
    "denied",
    "cancelled",
  ],
  identity_verification_required: ["identity_verified", "denied", "cancelled"],
  identity_verified: ["in_review", "action_required", "processing", "denied", "cancelled"],
  in_review: [
    "action_required",
    "processing",
    "completed",
    "partially_completed",
    "failed",
    "denied",
  ],
  action_required: ["processing", "completed", "partially_completed", "failed", "denied"],
  processing: ["completed", "partially_completed", "failed"],
  partially_completed: ["processing"],
  failed: ["processing"],
  blocked_by_legal_hold: [],
  completed: [],
  denied: [],
  cancelled: [],
};

export const PUBLIC_PRIVACY_REQUEST_ACK_MESSAGE =
  "We received your privacy request. We may need to verify your identity before processing it.";
