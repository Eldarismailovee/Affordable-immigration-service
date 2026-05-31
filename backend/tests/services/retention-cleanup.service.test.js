import test from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";
import {
  RETENTION_CATEGORIES,
  RETENTION_POLICY,
  SECURITY_AUDIT_RETENTION_DAYS,
  TECHNICAL_LOG_RETENTION_DAYS,
} from "../../src/constants/retention.js";

const passthroughLog = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  trace: () => {},
  fatal: () => {},
  child: () => passthroughLog,
};

function buildRepoMocks(t, { auditRows = [], adminRows = [] } = {}) {
  t.mock.module("../../src/lib/logger.js", {
    namedExports: { logger: passthroughLog },
  });

  t.mock.module("../../src/services/audit.service.js", {
    namedExports: { recordAuditEvent: async () => {} },
  });

  t.mock.module("../../src/config/env.js", {
    exports: {
      default: {
        TECHNICAL_LOG_RETENTION_DAYS: 90,
        SECURITY_AUDIT_RETENTION_DAYS: 365,
      },
    },
  });

  t.mock.module("../../src/repositories/retention.repository.js", {
    namedExports: {
      findDueCookieConsentLogs: async () => [],
      findDueExpiredOneTimeTokens: async () => [],
      deleteCookieConsentLogsByIds: async () => 0,
      deleteEmailVerificationTokensByIds: async () => 0,
      deletePasswordResetTokensByIds: async () => 0,
      findDueAuditEvents: async () => auditRows,
      anonymizeAuditEventsByIds: async (ids) => ids.length,
      findDueAdminAuditLogs: async () => adminRows,
      deleteAdminAuditLogsByIds: async (ids) => ids.length,
      findExpiredRefreshTokens: async () => [],
      findRevokedRefreshTokensOlderThan: async () => [],
      deleteRefreshTokensByIds: async () => 0,
      findInactiveLeadsDueForAnonymization: async () => [],
      anonymizeLeadById: async () => 0,
      findDocumentsDueForRetention: async () => [],
      anonymizeAgreementById: async () => 0,
      anonymizeOnboardingPacketById: async () => 0,
      findRetentionTarget: async () => null,
      updateRetentionOverride: async () => null,
      applyDocumentRetentionOverride: async () => null,
      deleteAuditEventsOlderThan: async () => 0,
      deleteAdminAuditLogsOlderThan: async () => 0,
      deleteCookieConsentLogsOlderThan: async () => 0,
      deleteExpiredAuthRefreshTokens: async () => 0,
    },
  });
}

test("retention policy defaults match GDPR technical 90d and security audit 365d", () => {
  assert.equal(TECHNICAL_LOG_RETENTION_DAYS, 90);
  assert.equal(SECURITY_AUDIT_RETENTION_DAYS, 365);
  assert.equal(RETENTION_POLICY.technicalLogDays, 90);
  assert.equal(RETENTION_POLICY.securityAuditDays, 365);
});

test("runRetentionJobs dryRun does not anonymize security audit rows", async (t) => {
  buildRepoMocks(t, {
    auditRows: [{ id: "a1", legal_hold: false, created_at: "2020-01-01T00:00:00.000Z" }],
  });

  const { runRetentionJobs } = await import(
    `../../src/services/retention.service.js?dry=${Math.random()}`
  );

  const summary = await runRetentionJobs({
    categories: [RETENTION_CATEGORIES.SECURITY_AUDIT],
    dryRun: true,
    limit: 10,
  });

  assert.equal(summary.dryRun, true);
  assert.equal(summary.results.security_audit.found, 1);
  assert.equal(summary.results.security_audit.anonymized, 0);
});

test("runRetentionJobs anonymizes audit rows unless legal hold is active", async (t) => {
  buildRepoMocks(t, {
    auditRows: [
      { id: "held", legal_hold: true, created_at: "2020-01-01T00:00:00.000Z" },
      { id: "free", legal_hold: false, created_at: "2020-01-01T00:00:00.000Z" },
    ],
  });

  const { runRetentionJobs } = await import(
    `../../src/services/retention.service.js?apply=${Math.random()}`
  );

  const summary = await runRetentionJobs({
    categories: [RETENTION_CATEGORIES.SECURITY_AUDIT],
    dryRun: false,
    limit: 10,
  });

  assert.equal(summary.results.security_audit.found, 2);
  assert.equal(summary.results.security_audit.skippedLegalHold, 1);
  assert.equal(summary.results.security_audit.anonymized, 1);
});

test("runRetentionCleanup legacy wrapper maps summary counts", async (t) => {
  buildRepoMocks(t);

  const { runRetentionCleanup } = await import(
    `../../src/services/retention.service.js?legacy=${Math.random()}`
  );

  const summary = await runRetentionCleanup();
  assert.equal(summary.deleted.cookieConsentLogs, 0);
  assert.equal(summary.deleted.expiredRefreshTokens, 0);
  assert.equal(summary.deleted.auditEvents, 0);
  assert.equal(summary.deleted.adminAuditLogs, 0);
  assert.equal(summary.technicalLogRetentionDays, 90);
});

test("applyRetentionAdminAction requires admin role", async (t) => {
  buildRepoMocks(t);

  const { applyRetentionAdminAction } = await import(
    `../../src/services/retention.service.js?admin=${Math.random()}`
  );

  await assert.rejects(
    () =>
      applyRetentionAdminAction({
        action: "apply_legal_hold",
        category: RETENTION_CATEGORIES.LEAD,
        targetId: "11111111-1111-4111-8111-111111111111",
        reason: "Matter referred to outside counsel review hold.",
        actor: { id: "u1", role: "user" },
      }),
    (error) => error.statusCode === 403
  );
});
