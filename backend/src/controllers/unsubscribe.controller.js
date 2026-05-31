import { processUnsubscribe } from "../services/email-compliance.service.js";
import { unsubscribeSchema } from "../schemas/email-compliance.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";
import { z } from "zod";

const unsubscribeResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const postUnsubscribeController = asyncHandler(async (req, res) => {
  const result = await processUnsubscribe(req.body);
  sendResponse(res, unsubscribeResponseSchema, result);
});

export const getUnsubscribeController = asyncHandler(async (req, res) => {
  const result = await processUnsubscribe({
    token: req.params.token,
    scope: req.query.scope,
  });
  sendResponse(res, unsubscribeResponseSchema, result);
});
