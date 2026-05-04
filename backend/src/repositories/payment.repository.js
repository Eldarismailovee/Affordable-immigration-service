import pool from "../db/pool.js";
import { withTransaction } from "../db/transaction.js";

export async function createPaymentRecord(
  {
    id,
    leadId,
    amountMin,
    amountMax,
    status = "pending_manual_processing",
    manualReview = true,
    notes,
    billingName,
    billingEmail,
    paymentPreference,
    consentManualProcessing,
  },
  db = pool
) {
  await db.query(
    `
    INSERT INTO payments (
      id,
      lead_id,
      amount_min,
      amount_max,
      status,
      manual_review,
      notes,
      billing_name,
      billing_email,
      payment_preference,
      consent_manual_processing,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
    `,
    [
      id,
      leadId,
      amountMin,
      amountMax,
      status,
      manualReview,
      notes || "Payment to be processed manually by office",
      billingName,
      billingEmail,
      paymentPreference,
      Boolean(consentManualProcessing),
    ]
  );
}

export async function updatePaymentStatusByLeadId(leadId, status, db = pool) {
  const { rows } = await db.query(
    `
    UPDATE payments
    SET status = $2, updated_at = NOW()
    WHERE lead_id = $1
    RETURNING
      id,
      lead_id,
      amount_min,
      amount_max,
      status,
      manual_review,
      notes,
      billing_name,
      billing_email,
      payment_preference,
      consent_manual_processing,
      created_at,
      updated_at
    `,
    [leadId, status]
  );

  return rows[0] || null;
}

export async function updateIntakePaymentStatusByLeadId(leadId, status, db = pool) {
  await db.query(
    `
    UPDATE intakes
    SET payment_status = $2
    WHERE lead_id = $1
    `,
    [leadId, status]
  );
}

export async function updateLeadPaymentStatusCascade(leadId, status) {
  return withTransaction(async (client) => {
    const payment = await updatePaymentStatusByLeadId(leadId, status, client);

    if (!payment) {
      return null;
    }

    await updateIntakePaymentStatusByLeadId(leadId, status, client);
    return payment;
  });
}
