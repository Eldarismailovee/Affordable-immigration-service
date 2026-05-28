import {
  updateIntakePaymentStatusByLeadId,
  updatePaymentStatusByLeadId,
} from "../repositories/payment.repository.js";
import { withUnitOfWork } from "../repositories/unit-of-work.repository.js";
import { paymentNotFoundError } from "../domain/errors.js";
import {
  assertCanUpdatePaymentStatus,
  parsePaymentStatus,
} from "../domain/payment.policy.js";

export function createManualPaymentRecord(payload) {
  return {
    success: true,
    paymentMode: "manual",
    email: payload.email || null,
    message: "Manual payment processing placeholder",
  };
}

export async function updateLeadPaymentStatus({ leadId, status, actor }) {
  assertCanUpdatePaymentStatus(actor);
  const nextStatus = parsePaymentStatus(status);

  const payment = await withUnitOfWork(async (client) => {
    const updatedPayment = await updatePaymentStatusByLeadId(leadId, nextStatus, client);

    if (!updatedPayment) {
      return null;
    }

    await updateIntakePaymentStatusByLeadId(leadId, nextStatus, client);
    return updatedPayment;
  });

  if (!payment) {
    throw paymentNotFoundError();
  }

  return payment;
}
