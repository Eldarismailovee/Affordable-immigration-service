import { mock } from "node:test";
import { RefreshTokenRotationError } from "../../src/repositories/auth-token.repository.js";
import {
  buildAgreementRepo,
  buildAuditRepo,
  buildAuthTokenRepo,
  buildLeadRepo,
  buildOnboardingRepo,
  buildUserRepo,
  createInMemoryStore,
} from "./inMemoryRepos.js";

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

  mock.module("../../src/repositories/auth-token.repository.js", {
    namedExports: {
      RefreshTokenRotationError,
      ...buildAuthTokenRepo(store),
    },
  });

  mock.module("../../src/repositories/lead.repository.js", {
    namedExports: buildLeadRepo(store),
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

  mock.module("../../src/middleware/rateLimit.js", {
    namedExports: {
      generalRateLimit: noopMiddleware,
      authRateLimit: noopMiddleware,
    },
  });

  mock.module("../../src/middleware/httpLogger.js", {
    namedExports: { httpLogger: noopMiddleware },
  });

  mock.module("../../src/lib/logger.js", {
    namedExports: { logger: passthroughLog },
  });

  mock.module("../../src/services/email.service.js", {
    namedExports: {
      sendEmailVerificationEmail: () => {},
      sendPasswordResetEmail: () => {},
    },
  });

  const { default: app } = await import("../../src/app.js");

  return { app, store };
}
