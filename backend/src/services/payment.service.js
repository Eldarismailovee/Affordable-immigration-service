import { withTransaction } from "../db/transaction.js";
import {
  updateIntakePaymentStatusByLeadId,
  updatePaymentStatusByLeadId,
} from "../repositories/payment.repository.js";

const allowedStatuses = [
  "pending_manual_processing",
  "payment_requested",
  "invoice_sent",
  "paid",
  "failed",
];

export function createManualPaymentRecord(payload) {
  return {
    success: true,
    paymentMode: "manual",
    email: payload.email || null,
    message: "Manual payment processing placeholder",
  };
}

export async function updateLeadPaymentStatus(leadId, status) {
  if (!allowedStatuses.includes(status)) {
    const error = new Error("Invalid payment status");
    error.statusCode = 400;
    throw error;
  }

  return withTransaction(async (client) => {
    const payment = await updatePaymentStatusByLeadId(leadId, status, client);

    if (!payment) {
      const error = new Error("Payment record not found");
      error.statusCode = 404;
      throw error;
    }

    await updateIntakePaymentStatusByLeadId(leadId, status, client);

    return payment;
  });
}
