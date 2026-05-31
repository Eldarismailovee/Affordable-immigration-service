import {
  setLeadHostedPaymentUrl,
  updateLeadPaymentStatus,
} from "../services/payment.service.js";
import { paymentMutationResponseSchema } from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAuditContext } from "../utils/auditContext.js";
import { sendResponse } from "../utils/sendResponse.js";

export const updatePaymentStatusController = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const { status } = req.body;
  const payment = await updateLeadPaymentStatus({
    leadId,
    status,
    actor: req.user,
    auditContext: getAuditContext(req),
  });

  sendResponse(res, paymentMutationResponseSchema, { payment });
});

export const updateHostedPaymentUrlController = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const { hostedPaymentUrl, provider, providerReference } = req.body;
  const payment = await setLeadHostedPaymentUrl({
    leadId,
    hostedPaymentUrl,
    provider,
    providerReference,
    actor: req.user,
  });

  sendResponse(res, paymentMutationResponseSchema, { payment });
});
