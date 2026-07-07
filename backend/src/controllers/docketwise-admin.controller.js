import { syncLeadToDocketwise } from "../services/docketwise-admin.service.js";
import { docketwiseSyncResponseSchema } from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";
import {
  applyIdempotentReplayHeader,
  executeIdempotentHttpCommand,
} from "../utils/idempotentCommand.js";
import { assertAdminAccess } from "../services/access.service.js";

export const syncLeadToDocketwiseController = asyncHandler(async (req, res) => {
  const result = await executeIdempotentHttpCommand({
    req,
    actor: req.user,
    authorizeReplay: async () => {
      assertAdminAccess(req.user);
    },
    handler: async (client) => {
      const payload = await syncLeadToDocketwise({
        leadId: req.params.leadId,
        actor: req.user,
        client,
      });

      return {
        httpStatus: 200,
        responseBody: payload,
        resourceType: "docketwise_sync",
        resourceId: payload.sync?.id ?? req.params.leadId,
      };
    },
  });

  applyIdempotentReplayHeader(res, result.replayed);
  sendResponse(res, docketwiseSyncResponseSchema, result.responseBody, result.httpStatus);
});
