import { loginUser } from "../services/auth.service.js";
import { logoutUser, refreshAuthSession } from "../services/session.service.js";
import {
  authResponseSchema,
  messageResponseSchema,
  tokenRefreshResponseSchema,
} from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getRequestContext } from "../utils/requestContext.js";
import { sendResponse } from "../utils/sendResponse.js";

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
