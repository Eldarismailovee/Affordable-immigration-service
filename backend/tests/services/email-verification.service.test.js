import test from "node:test";
import assert from "node:assert/strict";
import { AppError } from "../../src/utils/appError.js";

async function loadEmailVerificationService(t, { userRepo = {}, authTokenRepo = {}, emailService = {} } = {}) {
  t.mock.module("../../src/repositories/user.repository.js", {
    namedExports: {
      markUserEmailVerifiedById: async () => null,
      ...userRepo,
    },
  });

  t.mock.module("../../src/repositories/auth-token.repository.js", {
    namedExports: {
      consumeEmailVerificationToken: async () => null,
      createEmailVerificationToken: async () => null,
      ...authTokenRepo,
    },
  });

  t.mock.module("../../src/services/email.service.js", {
    namedExports: {
      sendEmailVerificationEmail: () => {},
      ...emailService,
    },
  });

  return import(`../../src/services/email-verification.service.js?case=${Math.random()}`);
}

function assertAppError(err, { statusCode, code, message }) {
  assert.ok(err instanceof AppError);
  assert.equal(err.name, "AppError");
  assert.equal(err.statusCode, statusCode);
  assert.equal(err.code, code);
  if (message) assert.match(err.message, message);
  return true;
}

test("confirmEmailVerification marks the user as verified when the token is valid", async (t) => {
  const verifications = [];
  const { confirmEmailVerification } = await loadEmailVerificationService(t, {
    userRepo: {
      markUserEmailVerifiedById: async (userId) => {
        verifications.push(userId);
        return null;
      },
    },
    authTokenRepo: {
      consumeEmailVerificationToken: async () => ({ user_id: "user-1" }),
    },
  });

  const result = await confirmEmailVerification("x".repeat(48));
  assert.deepEqual(verifications, ["user-1"]);
  assert.match(result.message, /Email verified/);
});

test("confirmEmailVerification rejects an invalid token with 400", async (t) => {
  const { confirmEmailVerification } = await loadEmailVerificationService(t, {
    authTokenRepo: { consumeEmailVerificationToken: async () => null },
  });

  await assert.rejects(confirmEmailVerification("bad"), (err) =>
    assertAppError(err, {
      statusCode: 400,
      code: "BAD_REQUEST",
    })
  );
});
