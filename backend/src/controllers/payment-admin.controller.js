import {
  setLeadHostedPaymentUrl,
  updateLeadPaymentStatus,
} from "../services/payment.service.js";
import { paymentMutationResponseSchema } from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAuditContext } from "../utils/auditContext.js";
import { sendResponse } from "../utils/sendResponse.js";
import {
  applyIdempotentReplayHeader,
  executeIdempotentHttpCommand,
} from "../utils/idempotentCommand.js";
import { assertCanUpdatePaymentStatus } from "../domain/payment.policy.js";

export const updatePaymentStatusController = asyncHandler(async (req, res) => {
  const auditContext = getAuditContext(req);

  const result = await executeIdempotentHttpCommand({
    req,
    auditContext,
    actor: req.user,
    authorizeReplay: async () => {
      assertCanUpdatePaymentStatus(req.user);
    },
    handler: async (client) => {
      const payment = await updateLeadPaymentStatus({
        leadId: req.params.leadId,
        status: req.body.status,
        actor: req.user,
        auditContext,
        client,
      });

      return {
        httpStatus: 200,
        responseBody: { payment },
        resourceType: "payment",
        resourceId: payment.id,
      };
    },
  });

  applyIdempotentReplayHeader(res, result.replayed);
  sendResponse(res, paymentMutationResponseSchema, result.responseBody, result.httpStatus);
});

export const updateHostedPaymentUrlController = asyncHandler(async (req, res) => {
  const result = await executeIdempotentHttpCommand({
    req,
    actor: req.user,
    authorizeReplay: async () => {
      assertCanUpdatePaymentStatus(req.user);
    },
    handler: async (client) => {
      const payment = await setLeadHostedPaymentUrl({
        leadId: req.params.leadId,
        hostedPaymentUrl: req.body.hostedPaymentUrl,
        provider: req.body.provider,
        providerReference: req.body.providerReference,
        actor: req.user,
        client,
      });

      return {
        httpStatus: 200,
        responseBody: { payment },
        resourceType: "payment",
        resourceId: payment.id,
      };
    },
  });

  applyIdempotentReplayHeader(res, result.replayed);
  sendResponse(res, paymentMutationResponseSchema, result.responseBody, result.httpStatus);
});
