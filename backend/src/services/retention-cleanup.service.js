import env from "../config/env.js";
import { RETENTION_POLICY } from "../constants/retention.js";
import { logger } from "../lib/logger.js";
import {
  deleteAdminAuditLogsOlderThan,
  deleteAuditEventsOlderThan,
  deleteCookieConsentLogsOlderThan,
  deleteExpiredAuthRefreshTokens,
} from "../repositories/retention.repository.js";

function cutoffDate(days) {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff;
}

export function getRetentionPolicy() {
  return {
    technicalLogDays: env.TECHNICAL_LOG_RETENTION_DAYS,
    securityAuditDays: env.SECURITY_AUDIT_RETENTION_DAYS,
    defaults: RETENTION_POLICY,
  };
}

export async function runRetentionCleanup() {
  const technicalCutoff = cutoffDate(env.TECHNICAL_LOG_RETENTION_DAYS);
  const auditCutoff = cutoffDate(env.SECURITY_AUDIT_RETENTION_DAYS);

  const cookieConsentDeleted = await deleteCookieConsentLogsOlderThan(technicalCutoff);
  const expiredRefreshTokensDeleted = await deleteExpiredAuthRefreshTokens();
  const auditEventsDeleted = await deleteAuditEventsOlderThan(auditCutoff);
  const adminAuditLogsDeleted = await deleteAdminAuditLogsOlderThan(auditCutoff);

  const summary = {
    technicalLogRetentionDays: env.TECHNICAL_LOG_RETENTION_DAYS,
    securityAuditRetentionDays: env.SECURITY_AUDIT_RETENTION_DAYS,
    technicalCutoff: technicalCutoff.toISOString(),
    auditCutoff: auditCutoff.toISOString(),
    deleted: {
      cookieConsentLogs: cookieConsentDeleted,
      expiredRefreshTokens: expiredRefreshTokensDeleted,
      auditEvents: auditEventsDeleted,
      adminAuditLogs: adminAuditLogsDeleted,
    },
  };

  logger.info(summary, "Retention cleanup completed");

  return summary;
}
