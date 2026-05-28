import { confirmPasswordReset, requestPasswordReset } from "../services/password-reset.service.js";
import { messageResponseSchema } from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const requestPasswordResetController = asyncHandler(async (req, res) => {
  const result = await requestPasswordReset(req.body);
  sendResponse(res, messageResponseSchema, result);
});

export const confirmPasswordResetController = asyncHandler(async (req, res) => {
  const result = await confirmPasswordReset(req.body);
  sendResponse(res, messageResponseSchema, result);
});
