export const USER_ROLES = ["admin", "user"];
export const USER_STATUSES = ["active", "disabled"];
export const LEAD_STATUSES = ["new", "reviewing", "contacted", "converted", "closed"];
export const PACKAGE_TYPES = ["guidance", "filing"];
export const CONSULTATION_TYPES = ["Zoom", "Phone"];
export const AGREEMENT_STATUSES = ["previewed", "generated"];
export const DOCUMENT_STATUSES = ["generated"];
export const BOOKING_STATUSES = ["requested", "scheduled", "completed", "cancelled"];
export const PAYMENT_STATUSES = [
  "pending_manual_processing",
  "payment_requested",
  "invoice_sent",
  "paid",
  "failed",
];
export const DOCKETWISE_STATUSES = ["not_synced", "synced", "error"];
export const PAYMENT_PREFERENCES = ["invoice", "office_call", "manual_follow_up"];
export const LANGUAGE_MODES = ["english", "bilingual"];
export const ADMIN_AUDIT_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

export const ACTIVE_USER_STATUS = "active";
export const ADMIN_ROLE = "admin";
export const USER_ROLE = "user";
export const GUIDANCE_PACKAGE = "guidance";
export const FILING_PACKAGE = "filing";
export const NEW_LEAD_STATUS = "new";
export const CLOSED_LEAD_STATUS = "closed";
export const DISABLED_USER_STATUS = "disabled";
export const GENERATED_DOCUMENT_STATUS = "generated";
export const REQUESTED_BOOKING_STATUS = "requested";
export const PENDING_PAYMENT_STATUS = "pending_manual_processing";
export const NOT_SYNCED_STATUS = "not_synced";
export const SYNCED_STATUS = "synced";

export const IMAGE_UPLOAD_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const IMAGE_UPLOAD_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
export const IMAGE_UPLOAD_EXTENSION_BY_MIME_TYPE = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
