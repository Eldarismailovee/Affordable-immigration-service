/** Operational / technical logs (HTTP app logs, metrics, cookie consent DB rows). */
export const TECHNICAL_LOG_RETENTION_DAYS = 90;

/** Security & compliance audit trail (audit_events, admin_audit_log). */
export const SECURITY_AUDIT_RETENTION_DAYS = 365;

export const RETENTION_POLICY = {
  technicalLogDays: TECHNICAL_LOG_RETENTION_DAYS,
  securityAuditDays: SECURITY_AUDIT_RETENTION_DAYS,
};
