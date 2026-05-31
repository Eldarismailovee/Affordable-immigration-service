import { runRetentionCleanup } from "../services/retention-cleanup.service.js";
import { logger } from "../lib/logger.js";

try {
  const summary = await runRetentionCleanup();
  logger.info(
    {
      auditEvents: summary.deleted.auditEvents,
      adminAuditLogs: summary.deleted.adminAuditLogs,
      cookieConsentLogs: summary.deleted.cookieConsentLogs,
    },
    "Retention purge finished"
  );
} catch (error) {
  logger.error({ err: error }, "Retention purge failed");
  process.exitCode = 1;
}
