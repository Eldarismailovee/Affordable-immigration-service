import { mock } from "node:test";
import { RefreshTokenRotationError } from "../../src/repositories/auth-token.repository.js";
import {
  buildAgreementRepo,
  buildAuditRepo,
  buildAuthTokenRepo,
  buildCookieConsentRepo,
  buildEmailSuppressionRepo,
  buildConflictCheckRepo,
  buildLeadRepo,
  buildOnboardingRepo,
  buildPaymentRepo,
  buildDsarExportRepo,
  buildDsarRepo,
  buildDocketwiseRepo,
  buildUserRepo,
  createInMemoryStore,
} from "./inMemoryRepos.js";
import { buildMfaChallengeRepo, buildMfaRepo } from "./inMemoryMfaRepos.js";
import { buildIdempotencyRepo } from "./inMemoryIdempotencyRepos.js";
import { buildIntakeDraftRepo } from "./inMemoryIntakeDraftRepos.js";

const noopMiddleware = (_req, _res, next) => next();
const passthroughLog = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  trace: () => {},
  fatal: () => {},
  child: () => passthroughLog,
};

export function clearStore(store) {
  for (const key of Object.keys(store)) {
    const value = store[key];
    if (Array.isArray(value)) value.length = 0;
    else if (value instanceof Map) value.clear();
  }
}

export async function setupTestEnvironment() {
  const store = createInMemoryStore();

  mock.module("../../src/repositories/user.repository.js", {
    namedExports: buildUserRepo(store),
  });

  mock.module("../../src/repositories/mfa.repository.js", {
    namedExports: buildMfaRepo(store),
  });

  mock.module("../../src/repositories/mfa-challenge.repository.js", {
    namedExports: buildMfaChallengeRepo(store),
  });

  mock.module("../../src/repositories/auth-token.repository.js", {
    namedExports: {
      RefreshTokenRotationError,
      ...buildAuthTokenRepo(store),
    },
  });

  mock.module("../../src/repositories/lead.repository.js", {
    namedExports: buildLeadRepo(store),
  });

  mock.module("../../src/repositories/conflict-check.repository.js", {
    namedExports: buildConflictCheckRepo(store),
  });

  mock.module("../../src/repositories/audit.repository.js", {
    namedExports: buildAuditRepo(store),
  });

  mock.module("../../src/repositories/agreement.repository.js", {
    namedExports: buildAgreementRepo(store),
  });

  mock.module("../../src/repositories/onboarding.repository.js", {
    namedExports: buildOnboardingRepo(store),
  });

  mock.module("../../src/repositories/payment.repository.js", {
    namedExports: buildPaymentRepo(store),
  });

  mock.module("../../src/repositories/docketwise.repository.js", {
    namedExports: buildDocketwiseRepo(store),
  });

  mock.module("../../src/repositories/dsar.repository.js", {
    namedExports: buildDsarRepo(store),
  });

  mock.module("../../src/repositories/dsar-export.repository.js", {
    namedExports: buildDsarExportRepo(store),
  });

  mock.module("../../src/repositories/idempotency.repository.js", {
    namedExports: buildIdempotencyRepo(store),
  });

  mock.module("../../src/repositories/intake-draft.repository.js", {
    namedExports: buildIntakeDraftRepo(store),
  });

  mock.module("../../src/repositories/cookie-consent.repository.js", {
    namedExports: buildCookieConsentRepo(store),
  });

  mock.module("../../src/repositories/email-suppression.repository.js", {
    namedExports: buildEmailSuppressionRepo(store),
  });

  mock.module("../../src/repositories/unit-of-work.repository.js", {
    namedExports: {
      withUnitOfWork: async (callback) => callback({}),
    },
  });

  mock.module("../../src/db/transaction.js", {
    namedExports: {
      withTransaction: async (callback) => callback({}),
    },
  });

  mock.module("../../src/middleware/rateLimit.js", {
    namedExports: {
      generalRateLimit: noopMiddleware,
      authRateLimit: noopMiddleware,
      mfaRateLimit: noopMiddleware,
      mfaSensitiveRateLimit: noopMiddleware,
      emailVerificationRateLimit: noopMiddleware,
      emailVerificationResendRateLimit: noopMiddleware,
      emailChangeRateLimit: noopMiddleware,
    },
  });

  mock.module("../../src/middleware/httpLogger.js", {
    namedExports: { httpLogger: noopMiddleware },
  });

  mock.module("../../src/lib/logger.js", {
    namedExports: { logger: passthroughLog },
  });

  const { default: app } = await import("../../src/app.js");

  return { app, store };
}
