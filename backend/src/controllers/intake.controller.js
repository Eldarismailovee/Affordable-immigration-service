import { createIntakeTransactional } from "../services/intake.service.js";
import { closeIntakeDraftAfterSubmit } from "../services/intake-draft.service.js";
import { intakeCreateResponseSchema } from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAuditContext } from "../utils/auditContext.js";
import { sendResponse } from "../utils/sendResponse.js";
import {
  applyIdempotentReplayHeader,
  executeIdempotentHttpCommand,
} from "../utils/idempotentCommand.js";
import { assertProcessingNotRestricted } from "../domain/processing.policy.js";

export const createIntakeController = asyncHandler(async (req, res) => {
  const auditContext = getAuditContext(req);

  const result = await executeIdempotentHttpCommand({
    req,
    auditContext,
    actor: req.user,
    authorizeReplay: async () => {
      assertProcessingNotRestricted(req.user);
    },
    handler: async (client) => {
      const { lead, leadId } = await createIntakeTransactional({
        payload: req.body,
        user: req.user,
        auditContext,
        client,
      });

      await closeIntakeDraftAfterSubmit(req.user.id, client);

      const responseBody = {
        message: "Intake submitted successfully",
        lead,
      };

      return {
        httpStatus: 201,
        responseBody,
        resourceType: "lead",
        resourceId: leadId,
      };
    },
  });

  applyIdempotentReplayHeader(res, result.replayed);
  sendResponse(res, intakeCreateResponseSchema, result.responseBody, result.httpStatus);
});
