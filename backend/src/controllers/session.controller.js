import { loginUser } from "../services/auth.service.js";
import { logoutUser, refreshAuthSession } from "../services/session.service.js";
import { messageResponseSchema } from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/appError.js";
import {
  clearRefreshTokenCookie,
  readRefreshTokenCookie,
} from "../utils/authCookies.js";
import { getAuditContext } from "../utils/auditContext.js";
import { getRequestContext } from "../utils/requestContext.js";
import {
  sendAuthSessionResponse,
  sendTokenRefreshResponse,
} from "../utils/sendAuthResponse.js";
import { sendResponse } from "../utils/sendResponse.js";

function missingRefreshTokenError() {
  return new AppError(
    "Invalid refresh token",
    401,
    "AUTHENTICATION_REQUIRED"
  );
}

export const loginController = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body, getRequestContext(req));
  sendAuthSessionResponse(res, result);
});

export const refreshController = asyncHandler(async (req, res) => {
  const refreshToken = readRefreshTokenCookie(req);

  if (!refreshToken) {
    clearRefreshTokenCookie(res);
    throw missingRefreshTokenError();
  }

  try {
    const result = await refreshAuthSession(refreshToken, getRequestContext(req));
    sendTokenRefreshResponse(res, result);
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 401) {
      clearRefreshTokenCookie(res);
    }

    throw error;
  }
});

export const logoutController = asyncHandler(async (req, res) => {
  const refreshToken = readRefreshTokenCookie(req);

  if (refreshToken) {
    await logoutUser(refreshToken, {
      actor: req.user,
      auditContext: getAuditContext(req),
    });
  }

  clearRefreshTokenCookie(res);
  sendResponse(res, messageResponseSchema, { message: "Signed out successfully" });
});
