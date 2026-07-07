import { createPublicPrivacyRequest } from "../services/dsar.service.js";
import { publicPrivacyRequestResponseSchema } from "../schemas/responses/dsar.response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAuditContext } from "../utils/auditContext.js";
import { sendResponse } from "../utils/sendResponse.js";
import {
  applyIdempotentReplayHeader,
  executeIdempotentHttpCommand,
} from "../utils/idempotentCommand.js";

export const createPublicPrivacyRequestController = asyncHandler(async (req, res) => {
  const auditContext = getAuditContext(req);

  const result = await executeIdempotentHttpCommand({
    req,
    auditContext,
    actor: req.user ?? null,
    handler: async (client) => {
      const responseBody = await createPublicPrivacyRequest({
        user: req.user ?? null,
        type: req.body.type,
        email: req.body.email,
        message: req.body.message,
        requestedChanges: req.body.requestedChanges,
        auditContext,
        client,
      });

      return {
        httpStatus: 201,
        responseBody,
        resourceType: "dsar_request",
        resourceId: responseBody.id,
      };
    },
  });

  applyIdempotentReplayHeader(res, result.replayed);
  sendResponse(res, publicPrivacyRequestResponseSchema, result.responseBody, result.httpStatus);
});
