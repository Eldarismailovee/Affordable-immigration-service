export const DSAR_REQUEST_TYPES = [
  "export",
  "correction",
  "deletion",
  "anonymization",
  "restriction",
];

export const DSAR_STATUSES = [
  "submitted",
  "identity_verification_required",
  "identity_verified",
  "in_review",
  "action_required",
  "completed",
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
  "correction_applied",
  "anonymization_applied",
  "restriction_applied",
  "legal_hold_applied",
  "legal_hold_removed",
  "denied",
  "completed",
  "cancelled",
  "admin_note_added",
];

export const DSAR_TYPES_REQUIRING_IDENTITY = [
  "export",
  "correction",
  "deletion",
  "anonymization",
  "restriction",
];

export const DSAR_CORRECTABLE_USER_FIELDS = ["full_name"];

export const DSAR_CORRECTABLE_LEAD_FIELDS = ["first_name", "last_name", "phone", "email"];

export const DSAR_STATUS_TRANSITIONS = {
  submitted: [
    "identity_verification_required",
    "identity_verified",
    "in_review",
    "denied",
    "cancelled",
  ],
  identity_verification_required: ["identity_verified", "denied", "cancelled"],
  identity_verified: ["in_review", "action_required", "denied", "cancelled"],
  in_review: ["action_required", "completed", "denied"],
  action_required: ["completed", "denied"],
  completed: [],
  denied: [],
  cancelled: [],
};
