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
import { sendResponse } from "../utils/sendResponse.js";

function getRequestContext(req) {
  return {
    userAgent: req.get("user-agent") || "",
    ipAddress: req.ip || "",
  };
}

export async function registerController(req, res, next) {
  try {
    const result = await registerUser(req.body, getRequestContext(req));
    sendResponse(res, authResponseSchema, result, 201);
  } catch (error) {
    next(error);
  }
}

export async function loginController(req, res, next) {
  try {
    const result = await loginUser(req.body, getRequestContext(req));
    sendResponse(res, authResponseSchema, result);
  } catch (error) {
    next(error);
  }
}

export async function refreshController(req, res, next) {
  try {
    const result = await refreshAuthSession(req.body.refreshToken, getRequestContext(req));
    sendResponse(res, tokenRefreshResponseSchema, result);
  } catch (error) {
    next(error);
  }
}

export async function logoutController(req, res, next) {
  try {
    const result = await logoutUser(req.body.refreshToken);
    sendResponse(res, messageResponseSchema, result);
  } catch (error) {
    next(error);
  }
}

export async function requestPasswordResetController(req, res, next) {
  try {
    const result = await requestPasswordReset(req.body);
    sendResponse(res, messageResponseSchema, result);
  } catch (error) {
    next(error);
  }
}

export async function confirmPasswordResetController(req, res, next) {
  try {
    const result = await confirmPasswordReset(req.body);
    sendResponse(res, messageResponseSchema, result);
  } catch (error) {
    next(error);
  }
}

export async function requestEmailVerificationController(req, res, next) {
  try {
    const result = await requestEmailVerification(req.user);
    sendResponse(res, messageResponseSchema, result);
  } catch (error) {
    next(error);
  }
}

export async function confirmEmailVerificationController(req, res, next) {
  try {
    const result = await confirmEmailVerification(req.body.token);
    sendResponse(res, messageResponseSchema, result);
  } catch (error) {
    next(error);
  }
}

export function meController(req, res) {
  sendResponse(res, meResponseSchema, { user: req.user || null });
}
