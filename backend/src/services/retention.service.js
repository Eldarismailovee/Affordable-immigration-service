import env from "../config/env.js";
import {
  RETENTION_ADMIN_ACTIONS,
  RETENTION_CATEGORIES,
  RETENTION_DAYS,
  RETENTION_POLICY,
} from "../constants/retention.js";
import { AUDIT_CATEGORIES, AUDIT_EVENT_TYPES, AUDIT_RESULTS } from "../constants/audit.js";
import { AppError } from "../utils/appError.js";
import {
  emptyCategoryResult,
  isLegalHoldActive,
  isInactiveLeadEligibleForAnonymization,
  isDocumentEligibleForAnonymization,
  isScheduledAnonymizationDue,
  summarizeRetentionRun,
} from "../domain/retention.policy.js";
import { recordAuditEvent } from "./audit.service.js";
import {
  anonymizeAgreementById,
  anonymizeAuditEventsByIds,
  anonymizeLeadById,
  anonymizeOnboardingPacketById,
  applyDocumentRetentionOverride,
  deleteAdminAuditLogsByIds,
  deleteCookieConsentLogsByIds,
  deleteEmailVerificationTokensByIds,
  deletePasswordResetTokensByIds,
  deleteRefreshTokensByIds,
  findDocumentsDueForRetention,
  findDueAdminAuditLogs,
  findDueAuditEvents,
  findDueCookieConsentLogs,
  findDueExpiredOneTimeTokens,
  findExpiredRefreshTokens,
  findInactiveLeadsDueForAnonymization,
  findRetentionTarget,
  findRevokedRefreshTokensOlderThan,
  updateRetentionOverride,
} from "../repositories/retention.repository.js";

function cutoffDate(days) {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff;
}

function resolveCategories(categories) {
  const all = Object.values(RETENTION_CATEGORIES);
  if (!categories?.length) {
    return all;
  }
  return categories.filter((category) => all.includes(category));
}

async function auditRetention({
  eventType,
  action,
  result = AUDIT_RESULTS.SUCCESS,
  actorUserId = null,
  actorRole = null,
  targetType = "retention",
  targetId = null,
  metadata = {},
  request = null,
}) {
  await recordAuditEvent({
    eventType,
    category: AUDIT_CATEGORIES.ADMIN_ACCESS,
    action,
    result,
    actorUserId,
    actorRole,
    targetType,
    targetId,
    request,
    metadata,
  });
}

async function runTechnicalLogRetention({ cutoff, limit, dryRun, actorUserId, reason }) {
  const result = emptyCategoryResult();

  const cookieRows = await findDueCookieConsentLogs(cutoff, limit);
  const tokenRows = await findDueExpiredOneTimeTokens(limit);
  result.found = cookieRows.length + tokenRows.length;

  if (dryRun || result.found === 0) {
    return result;
  }

  result.deleted += await deleteCookieConsentLogsByIds(cookieRows.map((row) => row.id));
  const emailIds = tokenRows
    .filter((row) => row.token_type === "email_verification")
    .map((row) => row.id);
  const passwordIds = tokenRows
    .filter((row) => row.token_type === "password_reset")
    .map((row) => row.id);
  result.deleted += await deleteEmailVerificationTokensByIds(emailIds);
  result.deleted += await deletePasswordResetTokensByIds(passwordIds);

  await auditRetention({
    eventType: AUDIT_EVENT_TYPES.RETENTION_TECHNICAL_LOG_DELETED,
    action: "technical_log_deleted",
    actorUserId,
    metadata: { dryRun, reason, count: result.deleted, category: RETENTION_CATEGORIES.TECHNICAL_LOG },
  });

  return result;
}

async function runSecurityAuditRetention({ cutoff, limit, dryRun, actorUserId, reason }) {
  const result = emptyCategoryResult();

  const auditRows = await findDueAuditEvents(cutoff, limit);
  const adminRows = await findDueAdminAuditLogs(cutoff, limit);
  result.found = auditRows.length + adminRows.length;

  const heldRows = auditRows.filter((row) => isLegalHoldActive(row));
  result.skippedLegalHold = heldRows.length;

  const eligibleAuditIds = auditRows.filter((row) => !isLegalHoldActive(row)).map((row) => row.id);

  if (dryRun) {
    return result;
  }

  if (eligibleAuditIds.length) {
    result.anonymized += await anonymizeAuditEventsByIds(eligibleAuditIds);
    await auditRetention({
      eventType: AUDIT_EVENT_TYPES.RETENTION_SECURITY_AUDIT_ANONYMIZED,
      action: "security_audit_anonymized",
      actorUserId,
      metadata: {
        dryRun,
        reason,
        count: result.anonymized,
        category: RETENTION_CATEGORIES.SECURITY_AUDIT,
      },
    });
  }

  if (heldRows.length) {
    await auditRetention({
      eventType: AUDIT_EVENT_TYPES.RETENTION_SKIPPED_LEGAL_HOLD,
      action: "security_audit_skipped_legal_hold",
      actorUserId,
      metadata: {
        dryRun,
        reason,
        count: heldRows.length,
        category: RETENTION_CATEGORIES.SECURITY_AUDIT,
      },
    });
  }

  if (adminRows.length) {
    result.deleted += await deleteAdminAuditLogsByIds(adminRows.map((row) => row.id));
  }

  return result;
}

async function runAuthSessionRetention({ cutoff, limit, dryRun, actorUserId, reason }) {
  const result = emptyCategoryResult();

  const expiredRows = await findExpiredRefreshTokens(limit);
  const revokedRows = await findRevokedRefreshTokensOlderThan(cutoff, limit);
  result.found = expiredRows.length + revokedRows.length;

  const ids = [...new Set([...expiredRows, ...revokedRows].map((row) => row.id))];

  if (dryRun || ids.length === 0) {
    return result;
  }

  result.deleted = await deleteRefreshTokensByIds(ids);
  result.revoked = revokedRows.length;

  await auditRetention({
    eventType: AUDIT_EVENT_TYPES.RETENTION_AUTH_SESSION_CLEANED,
    action: "auth_session_cleaned",
    actorUserId,
    metadata: { dryRun, reason, count: result.deleted, category: RETENTION_CATEGORIES.AUTH_SESSION },
  });

  return result;
}

async function runLeadRetention({ cutoff, limit, dryRun, actorUserId, reason }) {
  const result = emptyCategoryResult();
  const rows = await findInactiveLeadsDueForAnonymization(cutoff, limit);
  result.found = rows.length;

  for (const row of rows) {
    if (isLegalHoldActive(row)) {
      result.skippedLegalHold += 1;
      continue;
    }

    if (!isInactiveLeadEligibleForAnonymization(row, cutoff) && !isScheduledAnonymizationDue(row)) {
      continue;
    }

    if (dryRun) {
      continue;
    }

    try {
      const changed = await anonymizeLeadById(row.id);
      if (changed) {
        result.anonymized += 1;
        await auditRetention({
          eventType: AUDIT_EVENT_TYPES.RETENTION_LEAD_ANONYMIZED,
          action: "lead_anonymized",
          actorUserId,
          targetId: row.id,
          metadata: { dryRun, reason, category: RETENTION_CATEGORIES.LEAD },
        });
      }
    } catch {
      result.errors += 1;
      await auditRetention({
        eventType: AUDIT_EVENT_TYPES.RETENTION_SKIPPED_ERROR,
        action: "lead_anonymization_failed",
        result: AUDIT_RESULTS.FAILURE,
        actorUserId,
        targetId: row.id,
        metadata: { dryRun, reason, category: RETENTION_CATEGORIES.LEAD },
      });
    }
  }

  if (result.skippedLegalHold > 0) {
    await auditRetention({
      eventType: AUDIT_EVENT_TYPES.RETENTION_SKIPPED_LEGAL_HOLD,
      action: "lead_skipped_legal_hold",
      actorUserId,
      metadata: {
        dryRun,
        reason,
        count: result.skippedLegalHold,
        category: RETENTION_CATEGORIES.LEAD,
      },
    });
  }

  return result;
}

async function runDocumentRetention({ cutoff, limit, dryRun, actorUserId, reason }) {
  const result = emptyCategoryResult();
  const rows = await findDocumentsDueForRetention(cutoff, limit);
  result.found = rows.length;

  for (const row of rows) {
    if (isLegalHoldActive(row) || row.lead_legal_hold) {
      result.skippedLegalHold += 1;
      continue;
    }

    const lead = { status: row.lead_status, legal_hold: row.lead_legal_hold };
    if (
      !isDocumentEligibleForAnonymization(row, lead, cutoff) &&
      !isScheduledAnonymizationDue(row)
    ) {
      continue;
    }

    if (dryRun) {
      continue;
    }

    try {
      const changed =
        row.document_type === "onboarding_packet"
          ? await anonymizeOnboardingPacketById(row.id)
          : await anonymizeAgreementById(row.id);

      if (changed) {
        result.anonymized += 1;
        await auditRetention({
          eventType: AUDIT_EVENT_TYPES.RETENTION_DOCUMENT_ANONYMIZED,
          action: "document_anonymized",
          actorUserId,
          targetId: row.id,
          metadata: {
            dryRun,
            reason,
            category: RETENTION_CATEGORIES.DOCUMENT,
            documentType: row.document_type,
          },
        });
      }
    } catch {
      result.errors += 1;
      await auditRetention({
        eventType: AUDIT_EVENT_TYPES.RETENTION_SKIPPED_ERROR,
        action: "document_anonymization_failed",
        result: AUDIT_RESULTS.FAILURE,
        actorUserId,
        targetId: row.id,
        metadata: { dryRun, reason, category: RETENTION_CATEGORIES.DOCUMENT },
      });
    }
  }

  if (result.skippedLegalHold > 0) {
    await auditRetention({
      eventType: AUDIT_EVENT_TYPES.RETENTION_SKIPPED_LEGAL_HOLD,
      action: "document_skipped_legal_hold",
      actorUserId,
      metadata: {
        dryRun,
        reason,
        count: result.skippedLegalHold,
        category: RETENTION_CATEGORIES.DOCUMENT,
      },
    });
  }

  return result;
}

export function getRetentionPolicy() {
  return {
    technicalLogDays: env.TECHNICAL_LOG_RETENTION_DAYS,
    securityAuditDays: env.SECURITY_AUDIT_RETENTION_DAYS,
    authSessionDays: RETENTION_DAYS[RETENTION_CATEGORIES.AUTH_SESSION],
    leadDays: RETENTION_DAYS[RETENTION_CATEGORIES.LEAD],
    documentDays: RETENTION_DAYS[RETENTION_CATEGORIES.DOCUMENT],
    defaults: RETENTION_POLICY,
    stdoutLogsNote:
      "Application stdout logs (Pino) are rotated by hosting infrastructure; not purged from DB.",
  };
}

export async function runRetentionJobs({
  categories,
  limit = 100,
  dryRun = true,
  actorUserId = null,
  actorRole = null,
  reason = "scheduled_retention",
  request = null,
} = {}) {
  const startedAt = new Date().toISOString();
  const selected = resolveCategories(categories);
  const results = {};

  await auditRetention({
    eventType: AUDIT_EVENT_TYPES.RETENTION_RUN_STARTED,
    action: "run_retention",
    actorUserId,
    actorRole,
    request,
    metadata: { dryRun, reason, categories: selected, limit },
  });

  const technicalCutoff = cutoffDate(env.TECHNICAL_LOG_RETENTION_DAYS);
  const auditCutoff = cutoffDate(env.SECURITY_AUDIT_RETENTION_DAYS);
  const authCutoff = cutoffDate(RETENTION_DAYS[RETENTION_CATEGORIES.AUTH_SESSION]);
  const leadCutoff = cutoffDate(RETENTION_DAYS[RETENTION_CATEGORIES.LEAD]);
  const documentCutoff = cutoffDate(RETENTION_DAYS[RETENTION_CATEGORIES.DOCUMENT]);

  try {
    if (selected.includes(RETENTION_CATEGORIES.TECHNICAL_LOG)) {
      results[RETENTION_CATEGORIES.TECHNICAL_LOG] = await runTechnicalLogRetention({
        cutoff: technicalCutoff,
        limit,
        dryRun,
        actorUserId,
        reason,
      });
    }

    if (selected.includes(RETENTION_CATEGORIES.SECURITY_AUDIT)) {
      results[RETENTION_CATEGORIES.SECURITY_AUDIT] = await runSecurityAuditRetention({
        cutoff: auditCutoff,
        limit,
        dryRun,
        actorUserId,
        reason,
      });
    }

    if (selected.includes(RETENTION_CATEGORIES.AUTH_SESSION)) {
      results[RETENTION_CATEGORIES.AUTH_SESSION] = await runAuthSessionRetention({
        cutoff: authCutoff,
        limit,
        dryRun,
        actorUserId,
        reason,
      });
    }

    if (selected.includes(RETENTION_CATEGORIES.LEAD)) {
      results[RETENTION_CATEGORIES.LEAD] = await runLeadRetention({
        cutoff: leadCutoff,
        limit,
        dryRun,
        actorUserId,
        reason,
      });
    }

    if (selected.includes(RETENTION_CATEGORIES.DOCUMENT)) {
      results[RETENTION_CATEGORIES.DOCUMENT] = await runDocumentRetention({
        cutoff: documentCutoff,
        limit,
        dryRun,
        actorUserId,
        reason,
      });
    }
  } catch (error) {
    await auditRetention({
      eventType: AUDIT_EVENT_TYPES.RETENTION_SKIPPED_ERROR,
      action: "run_retention_failed",
      result: AUDIT_RESULTS.FAILURE,
      actorUserId,
      actorRole,
      request,
      metadata: { dryRun, reason, message: error.message },
    });
    throw error;
  }

  const completedAt = new Date().toISOString();
  const summary = summarizeRetentionRun({ dryRun, startedAt, completedAt, results });

  await auditRetention({
    eventType: AUDIT_EVENT_TYPES.RETENTION_RUN_COMPLETED,
    action: "run_retention_completed",
    actorUserId,
    actorRole,
    request,
    metadata: { dryRun, reason, results },
  });

  return summary;
}

export async function applyRetentionAdminAction({
  action,
  category,
  targetId,
  retentionUntil = null,
  scheduledAnonymizationAt = null,
  legalHold = null,
  reason,
  actor,
  request = null,
}) {
  if (!actor || actor.role !== "admin") {
    throw new AppError("Insufficient permissions", 403, "FORBIDDEN");
  }

  const target = await findRetentionTarget(category, targetId);
  if (!target && category !== RETENTION_CATEGORIES.TECHNICAL_LOG && category !== RETENTION_CATEGORIES.AUTH_SESSION) {
    throw new AppError("Retention target not found", 404, "NOT_FOUND");
  }

  if (
    action !== "remove_legal_hold" &&
    action !== "apply_legal_hold" &&
    isLegalHoldActive(target) &&
    (retentionUntil || scheduledAnonymizationAt)
  ) {
    throw new AppError(
      "Target is under legal hold; remove legal hold before changing retention schedule",
      409,
      "LEGAL_HOLD_ACTIVE"
    );
  }

  let eventType = AUDIT_EVENT_TYPES.RETENTION_OVERRIDE_APPLIED;
  let patch = {};

  switch (action) {
    case RETENTION_ADMIN_ACTIONS.SCHEDULE_ANONYMIZATION:
      patch = { scheduledAnonymizationAt, retentionUntil: null };
      break;
    case RETENTION_ADMIN_ACTIONS.CANCEL_SCHEDULED_ANONYMIZATION:
      patch = { scheduledAnonymizationAt: null };
      break;
    case RETENTION_ADMIN_ACTIONS.APPLY_LEGAL_HOLD:
      patch = { legalHold: true, legalHoldReason: reason };
      eventType = AUDIT_EVENT_TYPES.RETENTION_LEGAL_HOLD_APPLIED;
      break;
    case RETENTION_ADMIN_ACTIONS.REMOVE_LEGAL_HOLD:
      patch = { legalHold: false, legalHoldReason: null };
      eventType = AUDIT_EVENT_TYPES.RETENTION_LEGAL_HOLD_REMOVED;
      break;
    case RETENTION_ADMIN_ACTIONS.OVERRIDE_RETENTION_UNTIL:
      patch = { retentionUntil, scheduledAnonymizationAt: null };
      break;
    default:
      throw new AppError("Unsupported retention action", 400, "INVALID_RETENTION_ACTION");
  }

  let updated = null;

  if (category === RETENTION_CATEGORIES.DOCUMENT) {
    updated = await applyDocumentRetentionOverride({
      targetId,
      documentType: target.document_type,
      ...patch,
      reason,
      actorUserId: actor.id,
    });
  } else if (category === RETENTION_CATEGORIES.SECURITY_AUDIT) {
    updated = await updateRetentionOverride({
      tableKey: "security_audit",
      id: targetId,
      ...patch,
      reason,
      actorUserId: actor.id,
    });
  } else if (category === RETENTION_CATEGORIES.LEAD) {
    updated = await updateRetentionOverride({
      tableKey: "lead",
      id: targetId,
      ...patch,
      reason,
      actorUserId: actor.id,
    });
  } else {
    throw new AppError("Retention override not supported for category", 400, "INVALID_RETENTION_CATEGORY");
  }

  if (!updated) {
    throw new AppError("Retention target not found", 404, "NOT_FOUND");
  }

  await auditRetention({
    eventType,
    action,
    actorUserId: actor.id,
    actorRole: actor.role,
    targetId,
    request,
    metadata: { category, reason, ...patch },
  });

  return { category, targetId, action, applied: true };
}

/** @deprecated Use runRetentionJobs instead. */
export async function runRetentionCleanup(options = {}) {
  const summary = await runRetentionJobs({
    dryRun: false,
    limit: 1000,
    reason: "legacy_retention_cleanup",
    ...options,
  });

  return {
    technicalLogRetentionDays: env.TECHNICAL_LOG_RETENTION_DAYS,
    securityAuditRetentionDays: env.SECURITY_AUDIT_RETENTION_DAYS,
    deleted: {
      cookieConsentLogs: summary.results?.technical_log?.deleted ?? 0,
      expiredRefreshTokens: summary.results?.auth_session?.deleted ?? 0,
      auditEvents: summary.results?.security_audit?.anonymized ?? 0,
      adminAuditLogs: summary.results?.security_audit?.deleted ?? 0,
    },
  };
}

export { parseRetentionCliArgs, summarizeRetentionRun } from "../domain/retention.policy.js";
