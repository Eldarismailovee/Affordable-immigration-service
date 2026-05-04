import { updateLeadPaymentStatusCascade } from "../repositories/payment.repository.js";
import { paymentStatusSchema } from "../schemas/domain.schema.js";

export function createManualPaymentRecord(payload) {
  return {
    success: true,
    paymentMode: "manual",
    email: payload.email || null,
    message: "Manual payment processing placeholder",
  };
}

export async function updateLeadPaymentStatus(leadId, status) {
  const result = paymentStatusSchema.safeParse(status);

  if (!result.success) {
    const error = new Error("Invalid payment status");
    error.statusCode = 400;
    throw error;
  }

  const nextStatus = result.data;

  const payment = await updateLeadPaymentStatusCascade(leadId, nextStatus);

  if (!payment) {
    const error = new Error("Payment record not found");
    error.statusCode = 404;
    throw error;
  }

  return payment;
}
