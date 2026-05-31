/** Shared legal page metadata. Content is draft/compliance-oriented only. */
export const LEGAL_LAST_UPDATED = "May 31, 2026";

export const ATTORNEY_REVIEW_TODO =
  "TODO: Have final legal pages reviewed by a licensed attorney before production launch.";

export const SUBPROCESSORS_NOTICE =
  "We use service providers for hosting, email, payment processing, analytics if enabled, storage, and legal workflow tools. A current subprocessor list is maintained internally and will be updated as vendors change.";

export const SUBPROCESSORS_TODO =
  "TODO: Confirm actual vendor names, regions, and DPAs before launch. Do not publish a definitive public subprocessor list until verified with privacy counsel.";

/** Backend policy: technical logs 90d; security audit 365d (see backend/src/constants/retention.js). */
export const DATA_RETENTION = {
  technicalLogsDays: 90,
  securityAuditDays: 365,
};

export const RETENTION_TODO =
  "Operational logs and metrics are retained for 90 days. Security audit events are retained for 1 year where payment processing applies. DSAR and case records follow separate legal holds.";

export const REFUND_TODO =
  "TODO: Confirm refund windows and cancellation process.";

export const RESPONSIBLE_ATTORNEY_TODO =
  "TODO: Insert responsible attorney name, jurisdiction, bar number if required, and contact details before launch.";

export const BAR_ADVERTISING_TODO =
  "TODO: Check responsible attorney's state bar advertising rules before launch.";
