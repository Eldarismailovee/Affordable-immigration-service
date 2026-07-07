import { authenticationRequiredError } from "../domain/errors.js";
import {
  adminResetUserMfa,
  confirmMfaEnrollment,
  disableUserMfa,
  getMfaStatus,
  performStepUp,
  regenerateRecoveryCodes,
  resolveMfaChallenge,
  startMfaEnrollment,
  verifyMfaLogin,
} from "../services/mfa.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getRequestContext } from "../utils/requestContext.js";
import { setRefreshTokenCookie } from "../utils/authCookies.js";
import {
  sendAuthSessionResponse,
} from "../utils/sendAuthResponse.js";
import { sendResponse } from "../utils/sendResponse.js";
import {
  mfaEnrollmentCompleteResponseSchema,
  mfaEnrollmentConfirmResponseSchema,
  mfaEnrollmentStartResponseSchema,
  mfaStatusResponseSchema,
  mfaStepUpResponseSchema,
} from "../schemas/responses/mfa.response.schema.js";
import { messageResponseSchema } from "../schemas/response.schema.js";
import { MFA_CHALLENGE_PURPOSE } from "../constants/mfa.js";
import {
  applyIdempotentReplayHeader,
  executeIdempotentHttpCommand,
} from "../utils/idempotentCommand.js";
import { assertAdminAccess } from "../services/access.service.js";
import { findUserById } from "../repositories/user.repository.js";
import { sanitizeUser } from "../utils/auth.js";

async function resolveEnrollmentUser(req) {
  if (req.user) {
    return req.user;
  }

  const challengeToken = req.body?.challengeToken;

  if (!challengeToken) {
    return null;
  }

  const challenge = await resolveMfaChallenge(challengeToken, {
    expectedPurpose: MFA_CHALLENGE_PURPOSE.ENROLLMENT,
  });
  const user = await findUserById(challenge.user_id);
  return user ? sanitizeUser(user) : null;
}

export const verifyMfaController = asyncHandler(async (req, res) => {
  const result = await verifyMfaLogin({
    challengeToken: req.body.challengeToken,
    code: req.body.code,
    recoveryCode: req.body.recoveryCode,
    requestContext: getRequestContext(req),
  });

  sendAuthSessionResponse(res, result);
});

export const startEnrollmentController = asyncHandler(async (req, res) => {
  const user = await resolveEnrollmentUser(req);

  if (!user) {
    if (!req.body.challengeToken) {
      throw authenticationRequiredError();
    }
    throw authenticationRequiredError();
  }

  const result = await startMfaEnrollment({
    user,
    password: req.body.password,
    challengeToken: req.body.challengeToken,
    requestContext: getRequestContext(req),
  });

  const { secret: _secret, ...response } = result;

  sendResponse(res, mfaEnrollmentStartResponseSchema, {
    ...response,
    ...(process.env.NODE_ENV === "test" ? { secret: result.secret } : {}),
  });
});

export const confirmEnrollmentController = asyncHandler(async (req, res) => {
  const user = (await resolveEnrollmentUser(req)) ?? req.user;

  if (!user) {
    throw authenticationRequiredError();
  }

  const result = await confirmMfaEnrollment({
    user,
    code: req.body.code,
    challengeToken: req.body.challengeToken,
    requestContext: getRequestContext(req),
  });

  if (result.token) {
    if (result.refreshToken) {
      setRefreshTokenCookie(res, result.refreshToken);
    }
    sendResponse(res, mfaEnrollmentCompleteResponseSchema, result, 201);
    return;
  }

  sendResponse(res, mfaEnrollmentConfirmResponseSchema, result, 201);
});

export const regenerateRecoveryCodesController = asyncHandler(async (req, res) => {
  const result = await regenerateRecoveryCodes({
    user: req.user,
    password: req.body.password,
    requestContext: getRequestContext(req),
  });

  sendResponse(res, mfaEnrollmentConfirmResponseSchema, result);
});

export const disableMfaController = asyncHandler(async (req, res) => {
  const result = await disableUserMfa({
    user: req.user,
    password: req.body.password,
    code: req.body.code,
    recoveryCode: req.body.recoveryCode,
    requestContext: getRequestContext(req),
  });

  sendResponse(res, messageResponseSchema, result);
});

export const stepUpController = asyncHandler(async (req, res) => {
  const result = await performStepUp({
    user: req.user,
    code: req.body.code,
    recoveryCode: req.body.recoveryCode,
    sessionId: req.auth?.sid,
    requestContext: getRequestContext(req),
  });

  sendResponse(res, mfaStepUpResponseSchema, {
    token: result.token,
    expiresIn: result.expiresIn,
    mfaCompletedAt: result.mfaCompletedAt.toISOString(),
  });
});

export const getMfaStatusController = asyncHandler(async (req, res) => {
  const status = await getMfaStatus(req.user.id);
  sendResponse(res, mfaStatusResponseSchema, status);
});

export const adminResetMfaController = asyncHandler(async (req, res) => {
  const result = await executeIdempotentHttpCommand({
    req,
    actor: req.user,
    authorizeReplay: async () => {
      assertAdminAccess(req.user);
    },
    handler: async () => {
      const payload = await adminResetUserMfa({
        actor: req.user,
        targetUserId: req.body.userId,
        requestContext: getRequestContext(req),
      });

      return {
        httpStatus: 200,
        responseBody: payload,
        resourceType: "user",
        resourceId: req.body.userId,
      };
    },
  });

  applyIdempotentReplayHeader(res, result.replayed);
  sendResponse(res, messageResponseSchema, result.responseBody, result.httpStatus);
});
