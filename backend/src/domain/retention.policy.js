import { RETENTION_CATEGORIES, RETENTION_DAYS } from "../constants/retention.js";
import {
  APPROVED_PACKET_STATUS,
  DECLINED_LEAD_STATUS,
  NEW_LEAD_STATUS,
} from "../constants/domain.js";

const INACTIVE_LEAD_STATUSES = [NEW_LEAD_STATUS, DECLINED_LEAD_STATUS];
const PROTECTED_LEAD_STATUSES = [
  "conflict_check",
  "attorney_review",
  "accepted",
  "engaged",
  "filed",
];

export function isLegalHoldActive(record) {
  return record?.legal_hold === true;
}

export function isRetentionDue(record, cutoff) {
  if (!record || isLegalHoldActive(record)) {
    return false;
  }

  if (record.anonymized_at) {
    return false;
  }

  if (record.retention_until) {
    return new Date(record.retention_until) <= new Date();
  }

  if (record.created_at && cutoff) {
    return new Date(record.created_at) < new Date(cutoff);
  }

  if (record.updated_at && cutoff) {
    return new Date(record.updated_at) < new Date(cutoff);
  }

  return false;
}

export function isScheduledAnonymizationDue(record, now = new Date()) {
  if (!record?.scheduled_anonymization_at || isLegalHoldActive(record) || record.anonymized_at) {
    return false;
  }

  return new Date(record.scheduled_anonymization_at) <= now;
}

export function isInactiveLeadEligibleForAnonymization(lead, cutoff) {
  if (!lead || lead.deleted_at || lead.anonymized_at || isLegalHoldActive(lead)) {
    return false;
  }

  if (PROTECTED_LEAD_STATUSES.includes(lead.status)) {
    return false;
  }

  if (!INACTIVE_LEAD_STATUSES.includes(lead.status)) {
    return false;
  }

  if (isScheduledAnonymizationDue(lead)) {
    return true;
  }

  return isRetentionDue(lead, cutoff);
}

export function isDocumentEligibleForAnonymization(document, lead, cutoff) {
  if (!document || document.anonymized_at || isLegalHoldActive(document)) {
    return false;
  }

  if (lead && (isLegalHoldActive(lead) || PROTECTED_LEAD_STATUSES.includes(lead.status))) {
    if (document.status === APPROVED_PACKET_STATUS) {
      return false;
    }
  }

  if (isScheduledAnonymizationDue(document)) {
    return true;
  }

  return isRetentionDue(document, cutoff);
}

export function buildLeadAnonymizationPatch(leadId) {
  return {
    firstName: "Deleted",
    lastName: "Lead",
    email: `anonymized+${leadId}@deleted.local`,
    phone: null,
    deletedReason: "retention_expired",
  };
}

export function buildDocumentAnonymizationPatch() {
  return {
    title: "deleted-file",
    htmlContent: "",
    reviewNotes: null,
    deletedReason: "retention_expired",
  };
}

export function emptyCategoryResult() {
  return {
    found: 0,
    deleted: 0,
    anonymized: 0,
    revoked: 0,
    skippedLegalHold: 0,
    deletedFiles: 0,
    errors: 0,
  };
}

export function summarizeRetentionRun({ dryRun, startedAt, completedAt, results }) {
  return {
    dryRun,
    startedAt,
    completedAt,
    results,
  };
}

export function parseRetentionCliArgs(argv = process.argv.slice(2)) {
  const options = {
    dryRun: false,
    limit: 100,
    categories: null,
    reason: "scheduled_retention",
  };

  for (const arg of argv) {
    if (arg === "--dry-run" || arg === "--dryRun") {
      options.dryRun = true;
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const value = Number.parseInt(arg.slice("--limit=".length), 10);
      if (Number.isFinite(value) && value >= 1) {
        options.limit = Math.min(value, 1000);
      }
      continue;
    }

    if (arg.startsWith("--categories=")) {
      const raw = arg.slice("--categories=".length);
      options.categories = raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      continue;
    }

    if (arg.startsWith("--reason=")) {
      options.reason = arg.slice("--reason=".length).trim();
    }
  }

  if (options.categories) {
    options.categories = options.categories.filter((category) =>
      Object.values(RETENTION_CATEGORIES).includes(category)
    );
  }

  return options;
}

export function getRetentionDaysForCategory(category) {
  return RETENTION_DAYS[category] ?? null;
}
