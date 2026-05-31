import test from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";
import {
  RETENTION_POLICY,
  SECURITY_AUDIT_RETENTION_DAYS,
  TECHNICAL_LOG_RETENTION_DAYS,
} from "../../src/constants/retention.js";

test("retention policy defaults match GDPR technical 90d and security audit 365d", () => {
  assert.equal(TECHNICAL_LOG_RETENTION_DAYS, 90);
  assert.equal(SECURITY_AUDIT_RETENTION_DAYS, 365);
  assert.deepEqual(RETENTION_POLICY, {
    technicalLogDays: 90,
    securityAuditDays: 365,
  });
});

test("runRetentionCleanup applies separate cutoffs for technical and audit data", async (t) => {
  const calls = [];
  const passthroughLog = {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    trace: () => {},
    fatal: () => {},
    child: () => passthroughLog,
  };

  t.mock.module("../../src/lib/logger.js", {
    namedExports: { logger: passthroughLog },
  });

  t.mock.module("../../src/repositories/retention.repository.js", {
    namedExports: {
      deleteCookieConsentLogsOlderThan: async (cutoff) => {
        calls.push(["cookie", cutoff.toISOString()]);
        return 1;
      },
      deleteExpiredAuthRefreshTokens: async () => {
        calls.push(["refresh"]);
        return 2;
      },
      deleteAuditEventsOlderThan: async (cutoff) => {
        calls.push(["audit_events", cutoff.toISOString()]);
        return 3;
      },
      deleteAdminAuditLogsOlderThan: async (cutoff) => {
        calls.push(["admin_audit", cutoff.toISOString()]);
        return 4;
      },
    },
  });

  t.mock.module("../../src/config/env.js", {
    exports: {
      default: {
        TECHNICAL_LOG_RETENTION_DAYS: 90,
        SECURITY_AUDIT_RETENTION_DAYS: 365,
      },
    },
  });

  const { runRetentionCleanup } = await import(
    `../../src/services/retention-cleanup.service.js?case=${Math.random()}`
  );

  const summary = await runRetentionCleanup();

  assert.equal(calls.length, 4);
  assert.equal(summary.deleted.auditEvents, 3);
  assert.equal(summary.deleted.adminAuditLogs, 4);
  assert.equal(summary.deleted.cookieConsentLogs, 1);
  assert.equal(summary.deleted.expiredRefreshTokens, 2);

  const technicalCutoff = new Date(calls[0][1]);
  const auditCutoff = new Date(calls[2][1]);
  const dayMs = 24 * 60 * 60 * 1000;
  assert.ok(Date.now() - technicalCutoff.getTime() >= 89 * dayMs);
  assert.ok(Date.now() - auditCutoff.getTime() >= 364 * dayMs);
});
