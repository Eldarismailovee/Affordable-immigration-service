export const USER_ROLES = ["admin", "user", "attorney"];
export const USER_STATUSES = ["active", "disabled"];
export const LEAD_STATUSES = [
  "new",
  "conflict_check",
  "attorney_review",
  "accepted",
  "declined",
  "engaged",
  "filed",
];
export const CONFLICT_CHECK_RESULT_STATUSES = [
  "pending",
  "clear",
  "conflict_found",
  "needs_more_info",
];
export const ATTORNEY_REVIEW_RESULT_STATUSES = ["pending", "accepted", "declined"];
export const PACKAGE_TYPES = ["guidance", "filing"];
export const CONSULTATION_TYPES = ["Zoom", "Phone"];
export const AGREEMENT_STATUSES = ["previewed", "generated"];
export const DOCUMENT_STATUSES = ["draft", "approved"];
export const BOOKING_STATUSES = ["requested", "scheduled", "completed", "cancelled"];
export const PAYMENT_STATUSES = [
  "pending_manual_processing",
  "payment_requested",
  "invoice_sent",
  "paid",
  "failed",
];
export const DOCKETWISE_STATUSES = [
  "not_synced",
  "not_configured",
  "pending",
  "processing",
  "synced",
  "failed",
  "error",
];
export const PAYMENT_PREFERENCES = ["invoice", "office_call", "manual_follow_up"];
export const LANGUAGE_MODES = ["english", "bilingual"];
export const ADMIN_AUDIT_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

export const ACTIVE_USER_STATUS = "active";
export const ADMIN_ROLE = "admin";
export const USER_ROLE = "user";
export const ATTORNEY_ROLE = "attorney";
export const GUIDANCE_PACKAGE = "guidance";
export const FILING_PACKAGE = "filing";
export const NEW_LEAD_STATUS = "new";
export const ENGAGED_LEAD_STATUS = "engaged";
export const DECLINED_LEAD_STATUS = "declined";
export const DRAFT_PACKET_STATUS = "draft";
export const APPROVED_PACKET_STATUS = "approved";
export const REQUESTED_BOOKING_STATUS = "requested";
export const PENDING_PAYMENT_STATUS = "pending_manual_processing";
export const NOT_SYNCED_STATUS = "not_synced";
export const NOT_CONFIGURED_STATUS = "not_configured";
export const PENDING_INTEGRATION_STATUS = "pending";
export const PROCESSING_INTEGRATION_STATUS = "processing";
export const SYNCED_STATUS = "synced";
export const FAILED_INTEGRATION_STATUS = "failed";

export const IMAGE_UPLOAD_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const IMAGE_UPLOAD_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
export const IMAGE_UPLOAD_EXTENSION_BY_MIME_TYPE = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
