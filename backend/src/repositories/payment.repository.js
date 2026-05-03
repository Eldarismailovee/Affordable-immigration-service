import pool from "../db/pool.js";

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
