import { updateLeadPaymentStatus } from "../services/payment.service.js";
import { paymentMutationResponseSchema } from "../schemas/response.schema.js";
import { sendResponse } from "../utils/sendResponse.js";

export async function updatePaymentStatusController(req, res, next) {
  try {
    const { leadId } = req.params;
    const { status } = req.body;
    const payment = await updateLeadPaymentStatus(leadId, status);

    sendResponse(res, paymentMutationResponseSchema, { payment });
  } catch (error) {
    next(error);
  }
}
