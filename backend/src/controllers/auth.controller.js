import {
  confirmEmailVerification,
  confirmPasswordReset,
  loginUser,
  logoutUser,
  refreshAuthSession,
  registerUser,
  requestEmailVerification,
  requestPasswordReset,
} from "../services/auth.service.js";
import {
  authResponseSchema,
  meResponseSchema,
  messageResponseSchema,
  tokenRefreshResponseSchema,
} from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

function getRequestContext(req) {
  return {
    userAgent: req.get("user-agent") || "",
    ipAddress: req.ip || "",
  };
}

export const registerController = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body, getRequestContext(req));
  sendResponse(res, authResponseSchema, result, 201);
});

export const loginController = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body, getRequestContext(req));
  sendResponse(res, authResponseSchema, result);
});

export const refreshController = asyncHandler(async (req, res) => {
  const result = await refreshAuthSession(req.body.refreshToken, getRequestContext(req));
  sendResponse(res, tokenRefreshResponseSchema, result);
});

export const logoutController = asyncHandler(async (req, res) => {
  const result = await logoutUser(req.body.refreshToken);
  sendResponse(res, messageResponseSchema, result);
});

export const requestPasswordResetController = asyncHandler(async (req, res) => {
  const result = await requestPasswordReset(req.body);
  sendResponse(res, messageResponseSchema, result);
});

export const confirmPasswordResetController = asyncHandler(async (req, res) => {
  const result = await confirmPasswordReset(req.body);
  sendResponse(res, messageResponseSchema, result);
});

export const requestEmailVerificationController = asyncHandler(async (req, res) => {
  const result = await requestEmailVerification(req.user);
  sendResponse(res, messageResponseSchema, result);
});

export const confirmEmailVerificationController = asyncHandler(async (req, res) => {
  const result = await confirmEmailVerification(req.body.token);
  sendResponse(res, messageResponseSchema, result);
});

export const meController = asyncHandler((req, res) => {
  sendResponse(res, meResponseSchema, { user: req.user || null });
});
