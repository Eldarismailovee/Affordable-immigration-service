/** Rows in audit_events are purged after SECURITY_AUDIT_RETENTION_DAYS (default 365). */
export const AUDIT_RESULTS = {
  SUCCESS: "success",
  FAILURE: "failure",
};

export const AUDIT_CATEGORIES = {
  AUTH: "auth",
  INTAKE: "intake",
  DOCUMENT: "document",
  ADMIN_ACCESS: "admin_access",
  USER_ADMIN: "user_admin",
  PAYMENT: "payment",
  DSAR: "dsar",
};

export const AUDIT_AUTH_REASONS = {
  INVALID_CREDENTIALS: "invalid_credentials",
  DISABLED_USER: "disabled_user",
};

export const AUDIT_EVENT_TYPES = {
  AUTH_LOGIN_SUCCESS: "auth.login.success",
  AUTH_LOGIN_FAILURE: "auth.login.failure",
  AUTH_LOGOUT: "auth.logout",

  INTAKE_SUBMIT: "intake.submit",
  INTAKE_UPDATE: "intake.update",

  DOCUMENT_VIEW: "document.view",
  DOCUMENT_DOWNLOAD: "document.download",
  DOCUMENT_PDF_GENERATE: "document.pdf.generate",

  ADMIN_SENSITIVE_LEAD_READ: "admin.sensitive_lead.read",

  USER_ROLE_CHANGE: "user.role.change",

  PAYMENT_STATUS_CHANGE: "payment.status.change",

  DSAR_REQUEST_SUBMIT: "dsar.request.submit",
  DSAR_IDENTITY_VERIFY: "dsar.identity.verify",
  DSAR_EXPORT_GENERATE: "dsar.export.generate",
  DSAR_CORRECTION_APPLY: "dsar.correction.apply",
  DSAR_ANONYMIZATION_APPLY: "dsar.anonymization.apply",
  DSAR_RESTRICTION_APPLY: "dsar.restriction.apply",
  DSAR_LEGAL_HOLD_APPLY: "dsar.legal_hold.apply",
  DSAR_STATUS_CHANGE: "dsar.status.change",
};
