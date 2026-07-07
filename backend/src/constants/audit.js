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
  LEAD_WORKFLOW: "lead_workflow",
  EMAIL: "email",
  SECURITY: "security",
};

export const AUDIT_AUTH_REASONS = {
  INVALID_CREDENTIALS: "invalid_credentials",
  DISABLED_USER: "disabled_user",
};

export const AUDIT_EVENT_TYPES = {
  AUTH_LOGIN_SUCCESS: "auth.login.success",
  AUTH_LOGIN_FAILURE: "auth.login.failure",
  AUTH_LOGOUT: "auth.logout",

  MFA_ENROLLMENT_STARTED: "auth.mfa.enrollment_started",
  MFA_ENROLLMENT_COMPLETED: "auth.mfa.enrollment_completed",
  MFA_ENROLLMENT_FAILED: "auth.mfa.enrollment_failed",
  MFA_VERIFICATION_SUCCESS: "auth.mfa.verification_success",
  MFA_VERIFICATION_FAILED: "auth.mfa.verification_failed",
  MFA_RECOVERY_CODE_USED: "auth.mfa.recovery_code_used",
  MFA_RECOVERY_CODES_REGENERATED: "auth.mfa.recovery_codes_regenerated",
  MFA_DISABLED: "auth.mfa.disabled",
  MFA_ADMIN_RESET: "auth.mfa.admin_reset",
  MFA_STEP_UP_SUCCESS: "auth.mfa.step_up_success",
  MFA_STEP_UP_FAILED: "auth.mfa.step_up_failed",
  MFA_CHALLENGE_RATE_LIMITED: "auth.mfa.challenge_rate_limited",

  INTAKE_SUBMIT: "intake.submit",
  INTAKE_UPDATE: "intake.update",

  DOCUMENT_VIEW: "document.view",
  DOCUMENT_DOWNLOAD: "document.download",
  DOCUMENT_PDF_GENERATE: "document.pdf.generate",

  ADMIN_SENSITIVE_LEAD_READ: "admin.sensitive_lead.read",

  USER_ROLE_CHANGE: "user.role.change",

  PAYMENT_STATUS_CHANGE: "payment.status.change",

  DSAR_REQUEST_SUBMIT: "privacy.request.submitted",
  DSAR_IDENTITY_VERIFY: "privacy.identity.verified",
  DSAR_IDENTITY_FAILED: "privacy.identity.failed",
  DSAR_EXPORT_GENERATE: "privacy.export.json_generated",
  DSAR_EXPORT_PDF: "privacy.export.pdf_generated",
  DSAR_CORRECTION_APPLY: "privacy.correction.applied",
  DSAR_ANONYMIZATION_APPLY: "privacy.deletion.anonymized",
  DSAR_RESTRICTION_APPLY: "privacy.restriction.applied",
  DSAR_PORTABILITY_EXPORT: "privacy.portability.exported",
  DSAR_OBJECTION_RESOLVED: "privacy.objection.resolved",
  DSAR_CCPA_OPT_OUT: "privacy.ccpa_opt_out.recorded",
  DSAR_LEGAL_HOLD_APPLY: "privacy.legal_hold.applied",
  DSAR_LEGAL_HOLD_REMOVE: "privacy.legal_hold.removed",
  DSAR_STATUS_CHANGE: "privacy.status.changed",
  DSAR_REQUEST_DENIED: "privacy.request.denied",
  DSAR_REQUEST_COMPLETED: "privacy.request.completed",
  DSAR_ADMIN_NOTE: "privacy.admin_note.added",

  LEAD_STATUS_CHANGE: "lead.status_change",
  LEAD_CONFLICT_CHECK_UPDATED: "lead.conflict_check.updated",
  LEAD_ATTORNEY_REVIEW_ACCEPTED: "lead.attorney_review.accepted",
  LEAD_ATTORNEY_REVIEW_DECLINED: "lead.attorney_review.declined",
  AGREEMENT_ATTORNEY_APPROVED: "agreement.attorney_approved",
  FILING_PACKET_ATTORNEY_APPROVED: "filing_packet.attorney_approved",
  LEGAL_RECOMMENDATION_ATTORNEY_APPROVED: "legal_recommendation.attorney_approved",
  JURISDICTION_AVAILABILITY_CHECKED: "jurisdiction_availability.checked",

  RETENTION_RUN_STARTED: "retention.run.started",
  RETENTION_RUN_COMPLETED: "retention.run.completed",
  RETENTION_TECHNICAL_LOG_DELETED: "retention.technical_log.deleted",
  RETENTION_SECURITY_AUDIT_ANONYMIZED: "retention.security_audit.anonymized",
  RETENTION_SKIPPED_LEGAL_HOLD: "retention.skipped_legal_hold",
  RETENTION_AUTH_SESSION_CLEANED: "retention.auth_session.cleaned",
  RETENTION_LEAD_ANONYMIZED: "retention.lead.anonymized",
  RETENTION_DOCUMENT_ANONYMIZED: "retention.document.anonymized",
  RETENTION_DOCUMENT_FILE_DELETE_SCHEDULED: "retention.document.file_delete_scheduled",
  RETENTION_OVERRIDE_APPLIED: "retention.override.applied",
  RETENTION_LEGAL_HOLD_APPLIED: "retention.legal_hold.applied",
  RETENTION_LEGAL_HOLD_REMOVED: "retention.legal_hold.removed",
  RETENTION_SKIPPED_ERROR: "retention.skipped_error",

  EMAIL_MARKETING_CONSENT_GRANTED: "email.marketing_consent.granted",
  EMAIL_MARKETING_CONSENT_WITHDRAWN: "email.marketing_consent.withdrawn",
  EMAIL_UNSUBSCRIBE_CREATED: "email.unsubscribe.created",
  EMAIL_SUPPRESSION_ADDED: "email.suppression.added",
  EMAIL_SUPPRESSION_REMOVED: "email.suppression.removed",
  EMAIL_MARKETING_SKIPPED_SUPPRESSED: "email.marketing.skipped_suppressed",
  EMAIL_MARKETING_SENT: "email.marketing.sent",
  EMAIL_TRANSACTIONAL_SENT: "email.transactional.sent",

  EMAIL_VERIFICATION_TOKEN_CREATED: "auth.email_verification.token_created",
  EMAIL_VERIFICATION_DELIVERY_REQUESTED: "auth.email_verification.delivery_requested",
  EMAIL_VERIFICATION_PROVIDER_ACCEPTED: "auth.email_verification.provider_accepted",
  EMAIL_VERIFICATION_DELIVERY_FAILED: "auth.email_verification.delivery_failed",
  EMAIL_VERIFIED: "auth.email.verified",
  EMAIL_VERIFICATION_TOKEN_EXPIRED: "auth.email_verification.token_expired",
  EMAIL_VERIFICATION_REPLAY_ATTEMPTED: "auth.email_verification.replay_attempted",
  EMAIL_VERIFICATION_RATE_LIMITED: "auth.email_verification.rate_limited",
  EMAIL_VERIFICATION_RESENT: "auth.email_verification.resent",
  EMAIL_CHANGE_REQUESTED: "auth.email.change_requested",
  EMAIL_CHANGE_COMPLETED: "auth.email.change_completed",
  EMAIL_CHANGE_CANCELLED: "auth.email.change_cancelled",

  IDEMPOTENCY_KEY_CONFLICT: "security.idempotency.key_conflict",
  IDEMPOTENCY_REPLAY: "security.idempotency.replay",
};
