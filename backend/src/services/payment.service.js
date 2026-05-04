import {
  updateIntakePaymentStatusByLeadId,
  updatePaymentStatusByLeadId,
} from "../repositories/payment.repository.js";
import { withUnitOfWork } from "../repositories/unit-of-work.repository.js";
import { paymentStatusSchema } from "../domain/validators.js";
import { AppError } from "../utils/appError.js";
import { assertAdminAccess } from "./access.service.js";

export function createManualPaymentRecord(payload) {
  return {
    success: true,
    paymentMode: "manual",
    email: payload.email || null,
    message: "Manual payment processing placeholder",
  };
}

export async function updateLeadPaymentStatus({ leadId, status, actor }) {
  assertAdminAccess(actor);

  const result = paymentStatusSchema.safeParse(status);

  if (!result.success) {
    throw new AppError("Invalid payment status", 400, "INVALID_PAYMENT_STATUS");
  }

  const nextStatus = result.data;

  const payment = await withUnitOfWork(async (client) => {
    const updatedPayment = await updatePaymentStatusByLeadId(leadId, nextStatus, client);

    if (!updatedPayment) {
      return null;
    }

    await updateIntakePaymentStatusByLeadId(leadId, nextStatus, client);
    return updatedPayment;
  });

  if (!payment) {
    throw new AppError("Payment record not found", 404, "PAYMENT_NOT_FOUND");
  }

  return payment;
}
