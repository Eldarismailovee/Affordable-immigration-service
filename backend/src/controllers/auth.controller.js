import { registerUser } from "../services/auth.service.js";
import { authResponseSchema, meResponseSchema } from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getRequestContext } from "../utils/requestContext.js";
import { sendResponse } from "../utils/sendResponse.js";

export const registerController = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body, getRequestContext(req));
  sendResponse(res, authResponseSchema, result, 201);
});

export const meController = asyncHandler((req, res) => {
  sendResponse(res, meResponseSchema, { user: req.user || null });
});
