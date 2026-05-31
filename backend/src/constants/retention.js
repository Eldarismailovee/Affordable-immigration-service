/** Operational / technical logs (HTTP app logs, metrics, cookie consent DB rows). */
export const TECHNICAL_LOG_RETENTION_DAYS = 90;

/** Security & compliance audit trail (audit_events, admin_audit_log). */
export const SECURITY_AUDIT_RETENTION_DAYS = 365;

/** Revoked refresh token rows kept after expiry/revocation. */
export const AUTH_SESSION_RETENTION_DAYS = 90;

/** Inactive lead PII (new/declined, no engagement). TODO: confirm with counsel before production. */
export const LEAD_RETENTION_DAYS = 365;

/** Generated agreement/onboarding HTML metadata. TODO: confirm with counsel before production. */
export const DOCUMENT_RETENTION_DAYS = 365 * 7;

export const RETENTION_POLICY = {
  technicalLogDays: TECHNICAL_LOG_RETENTION_DAYS,
  securityAuditDays: SECURITY_AUDIT_RETENTION_DAYS,
  authSessionDays: AUTH_SESSION_RETENTION_DAYS,
  leadDays: LEAD_RETENTION_DAYS,
  documentDays: DOCUMENT_RETENTION_DAYS,
};

export const RETENTION_CATEGORIES = {
  TECHNICAL_LOG: "technical_log",
  SECURITY_AUDIT: "security_audit",
  AUTH_SESSION: "auth_session",
  LEAD: "lead",
  DOCUMENT: "document",
};

export const RETENTION_CATEGORY_VALUES = Object.values(RETENTION_CATEGORIES);

export const RETENTION_DAYS = {
  [RETENTION_CATEGORIES.TECHNICAL_LOG]: TECHNICAL_LOG_RETENTION_DAYS,
  [RETENTION_CATEGORIES.SECURITY_AUDIT]: SECURITY_AUDIT_RETENTION_DAYS,
  [RETENTION_CATEGORIES.AUTH_SESSION]: AUTH_SESSION_RETENTION_DAYS,
  [RETENTION_CATEGORIES.LEAD]: LEAD_RETENTION_DAYS,
  [RETENTION_CATEGORIES.DOCUMENT]: DOCUMENT_RETENTION_DAYS,
};

export const RETENTION_DELETED_REASON = "retention_expired";

export const RETENTION_ADMIN_ACTIONS = {
  RUN: "run_retention",
  SCHEDULE_ANONYMIZATION: "schedule_anonymization",
  CANCEL_SCHEDULED_ANONYMIZATION: "cancel_scheduled_anonymization",
  APPLY_LEGAL_HOLD: "apply_legal_hold",
  REMOVE_LEGAL_HOLD: "remove_legal_hold",
  OVERRIDE_RETENTION_UNTIL: "override_retention_until",
};
