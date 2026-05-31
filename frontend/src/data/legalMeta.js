/** Shared legal page metadata — production-safe public copy only. */

export const LEGAL_LAST_UPDATED = "May 31, 2026";

export const legalMeta = {
  lastUpdated: "2026-05-31",
  responsibleAttorney: {
    displayMode: "pending_verified_details",
    publicText:
      "Responsible attorney details will be provided in engagement materials and required attorney disclosures before representation begins. This site does not create an attorney-client relationship by itself.",
    name: null,
    jurisdictions: [],
    barNumber: null,
    contactEmail: null,
  },
  attorneyAdvertisingNotice:
    "This website may be considered attorney advertising in some jurisdictions. State-specific advertising labels or disclaimers may apply and will be added where required.",
  attorneyReviewNotice:
    "These terms and policies apply to your use of the site. Submitting information through this site does not create an attorney-client relationship. Any legal service engagement is subject to attorney review, conflict checks, jurisdiction availability, and written confirmation of the scope of representation.",
  refundCancellationNotice:
    "Refund and cancellation requests may be submitted by contacting us at the support or legal contact listed on this site. Refund eligibility depends on the service purchased, whether work has begun, whether attorney review or document preparation has started, and whether any government or third-party fees have already been paid. Government filing fees and third-party provider fees may be non-refundable once paid. The final refund terms applicable to your service will be stated at checkout or in your engagement materials.",
  subprocessorsNotice:
    "We use service providers for hosting, email delivery, payment processing, storage, analytics if enabled, and legal workflow tools as needed to operate the service. We maintain vendor records internally and update disclosures as vendors change.",
  subprocessorsDetailNotice:
    "Vendor-specific names, processing regions, and contractual safeguards are confirmed before production launch. Until then, categories of providers are described in this policy rather than a definitive public subprocessor list.",
  euTransferNotice:
    "For EU/EEA/UK data transfers, we use appropriate transfer safeguards where required, such as Standard Contractual Clauses or other recognized transfer mechanisms. Vendor-specific transfer mechanisms are reviewed as part of our subprocessor process. We do not represent that any vendor is Data Privacy Framework certified unless confirmed from the official DPF list or vendor contract.",
  dataRetentionSummary:
    "Operational logs and metrics are retained for 90 days. Security audit events are retained for 1 year where payment processing applies. DSAR and case records follow separate legal holds and professional recordkeeping obligations.",
};

/** Backend policy: technical logs 90d; security audit 365d (see backend/src/constants/retention.js). */
export const DATA_RETENTION = {
  technicalLogsDays: 90,
  securityAuditDays: 365,
};

// Named exports for existing imports — production-safe public strings only.
export const ATTORNEY_REVIEW_NOTICE = legalMeta.attorneyReviewNotice;
export const SUBPROCESSORS_NOTICE = legalMeta.subprocessorsNotice;
export const SUBPROCESSORS_DETAIL_NOTICE = legalMeta.subprocessorsDetailNotice;
export const EU_TRANSFER_NOTICE = legalMeta.euTransferNotice;
export const DATA_RETENTION_SUMMARY = legalMeta.dataRetentionSummary;
export const REFUND_CANCELLATION_NOTICE = legalMeta.refundCancellationNotice;
export const RESPONSIBLE_ATTORNEY_PUBLIC_TEXT = legalMeta.responsibleAttorney.publicText;
export const BAR_ADVERTISING_NOTICE = legalMeta.attorneyAdvertisingNotice;
