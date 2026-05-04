import { syncLeadToDocketwise } from "../services/docketwise-admin.service.js";
import { docketwiseSyncResponseSchema } from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const syncLeadToDocketwiseController = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const result = await syncLeadToDocketwise({ leadId, actor: req.user });
  sendResponse(res, docketwiseSyncResponseSchema, result);
});
