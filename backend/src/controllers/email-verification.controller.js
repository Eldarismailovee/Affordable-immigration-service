import {
  confirmEmailVerification,
  requestEmailVerification,
} from "../services/email-verification.service.js";
import { messageResponseSchema } from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const requestEmailVerificationController = asyncHandler(async (req, res) => {
  const result = await requestEmailVerification(req.user);
  sendResponse(res, messageResponseSchema, result);
});

export const confirmEmailVerificationController = asyncHandler(async (req, res) => {
  const result = await confirmEmailVerification(req.body.token);
  sendResponse(res, messageResponseSchema, result);
});
