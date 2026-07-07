export const IDEMPOTENCY_STATES = Object.freeze({
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED_RETRYABLE: "failed_retryable",
  FAILED_TERMINAL: "failed_terminal",
});

export const IDEMPOTENCY_OPERATIONS = Object.freeze({
  INTAKE_CREATE: "intake.create",
  DSAR_CREATE: "dsar.create",
  DSAR_PUBLIC_CREATE: "dsar.public.create",
  DSAR_ANONYMIZE: "dsar.anonymize",
  DSAR_EXPORT: "dsar.export",
  PAYMENT_HOSTED_URL: "payment.hosted_url.set",
  PAYMENT_STATUS: "payment.status.update",
  ADMIN_USER_ROLE_CHANGE: "admin.user.role.change",
  ADMIN_USER_DELETE: "admin.user.delete",
  MFA_ADMIN_RESET: "mfa.admin.reset",
  DOCKETWISE_SYNC: "docketwise.sync",
  AGREEMENT_GENERATE: "agreement.generate",
  AGREEMENT_APPROVE: "agreement.approve",
  RETENTION_RUN: "retention.run",
  RETENTION_ACTION: "retention.action",
});

/** Operations that require Idempotency-Key header (immediate enforcement). */
export const IDEMPOTENCY_REQUIRED_OPERATIONS = new Set(Object.values(IDEMPOTENCY_OPERATIONS));

export const IDEMPOTENCY_ERROR_CODES = Object.freeze({
  KEY_REQUIRED: "idempotency_key_required",
  INVALID_KEY: "invalid_idempotency_key",
  KEY_CONFLICT: "idempotency_key_conflict",
  REQUEST_IN_PROGRESS: "idempotency_request_in_progress",
});

export const IDEMPOTENCY_REPLAY_HEADER = "Idempotent-Replayed";

export const IDEMPOTENCY_FORBIDDEN_RESPONSE_HEADERS = new Set([
  "set-cookie",
  "authorization",
]);
