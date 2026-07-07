import {
  confirmEmailVerification,
  requestEmailVerification,
  resendEmailVerificationPublic,
} from "../services/email-verification.service.js";
import {
  authResponseSchema,
  messageResponseSchema,
} from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";
import { sendAuthSessionResponse } from "../utils/sendAuthResponse.js";
import { getRequestContext } from "../utils/requestContext.js";

export const requestEmailVerificationController = asyncHandler(async (req, res) => {
  const result = await requestEmailVerification(req.user, getRequestContext(req));
  sendResponse(res, messageResponseSchema, result);
});

export const resendEmailVerificationPublicController = asyncHandler(async (req, res) => {
  const result = await resendEmailVerificationPublic(req.body, getRequestContext(req));
  sendResponse(res, messageResponseSchema, result);
});

export const confirmEmailVerificationController = asyncHandler(async (req, res) => {
  const result = await confirmEmailVerification(req.body.token, getRequestContext(req));

  if (result.token) {
    sendAuthSessionResponse(res, {
      user: result.user,
      token: result.token,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    });
    return;
  }

  sendResponse(res, messageResponseSchema, result);
});
