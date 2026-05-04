import { updateLeadPaymentStatus } from "../services/payment.service.js";
import { paymentMutationResponseSchema } from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const updatePaymentStatusController = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const { status } = req.body;
  const payment = await updateLeadPaymentStatus({
    leadId,
    status,
    actor: req.user,
  });

  sendResponse(res, paymentMutationResponseSchema, { payment });
});
