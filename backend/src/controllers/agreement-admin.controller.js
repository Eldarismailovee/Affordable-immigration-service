import { generateAgreementForLead } from "../services/agreement-admin.service.js";
import { approveAgreementPacket } from "../services/packet-approval.service.js";
import {
  agreementGenerationResponseSchema,
  packetApprovalResponseSchema,
} from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";
import {
  applyIdempotentReplayHeader,
  executeIdempotentHttpCommand,
} from "../utils/idempotentCommand.js";
import { assertStaffAccess } from "../services/access.service.js";

export const generateAgreementForLeadController = asyncHandler(async (req, res) => {
  const result = await executeIdempotentHttpCommand({
    req,
    actor: req.user,
    authorizeReplay: async () => {
      assertStaffAccess(req.user);
    },
    handler: async () => {
      const payload = await generateAgreementForLead({
        leadId: req.params.leadId,
        actor: req.user,
      });

      return {
        httpStatus: payload.alreadyExists ? 200 : 201,
        responseBody: payload,
        resourceType: "agreement",
        resourceId: req.params.leadId,
      };
    },
  });

  applyIdempotentReplayHeader(res, result.replayed);
  sendResponse(
    res,
    agreementGenerationResponseSchema,
    result.responseBody,
    result.httpStatus
  );
});

export const approveAgreementController = asyncHandler(async (req, res) => {
  const result = await executeIdempotentHttpCommand({
    req,
    actor: req.user,
    authorizeReplay: async () => {
      assertStaffAccess(req.user);
    },
    handler: async () => {
      const agreement = await approveAgreementPacket({
        leadId: req.params.leadId,
        actor: req.user,
        reviewNotes: req.body.reviewNotes,
      });

      return {
        httpStatus: 200,
        responseBody: { agreement },
        resourceType: "agreement",
        resourceId: agreement?.id ?? req.params.leadId,
      };
    },
  });

  applyIdempotentReplayHeader(res, result.replayed);
  sendResponse(res, packetApprovalResponseSchema, result.responseBody, result.httpStatus);
});
