import { createPublicPrivacyRequest } from "../services/dsar.service.js";
import { publicPrivacyRequestResponseSchema } from "../schemas/responses/dsar.response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAuditContext } from "../utils/auditContext.js";
import { sendResponse } from "../utils/sendResponse.js";

export const createPublicPrivacyRequestController = asyncHandler(async (req, res) => {
  const result = await createPublicPrivacyRequest({
    user: req.user ?? null,
    type: req.body.type,
    email: req.body.email,
    message: req.body.message,
    requestedChanges: req.body.requestedChanges,
    auditContext: getAuditContext(req),
  });
  sendResponse(res, publicPrivacyRequestResponseSchema, result, 201);
});
