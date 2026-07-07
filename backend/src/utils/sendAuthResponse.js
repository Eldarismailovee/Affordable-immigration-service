import {
  authResponseSchema,
  tokenRefreshResponseSchema,
} from "../schemas/response.schema.js";
import { mfaChallengeResponseSchema } from "../schemas/responses/mfa.response.schema.js";
import { setRefreshTokenCookie } from "./authCookies.js";
import { sendResponse } from "./sendResponse.js";

function stripRefreshToken(result) {
  const { refreshToken: _refreshToken, ...body } = result;
  return body;
}

export function sendAuthSessionResponse(res, result, statusCode = 200) {
  if (result.mfaRequired || result.mfaEnrollmentRequired) {
    return sendResponse(res, mfaChallengeResponseSchema, result, statusCode);
  }

  if (result.refreshToken) {
    setRefreshTokenCookie(res, result.refreshToken);
  }

  return sendResponse(res, authResponseSchema, stripRefreshToken(result), statusCode);
}

export function sendMfaChallengeResponse(res, result, statusCode = 200) {
  return sendResponse(res, mfaChallengeResponseSchema, result, statusCode);
}

export function sendTokenRefreshResponse(res, result) {
  if (result.refreshToken) {
    setRefreshTokenCookie(res, result.refreshToken);
  }

  return sendResponse(res, tokenRefreshResponseSchema, stripRefreshToken(result));
}
