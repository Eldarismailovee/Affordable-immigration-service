import pool from "../db/pool.js";

const allowedStatuses = [
  "pending_manual_processing",
  "payment_requested",
  "invoice_sent",
  "paid",
  "failed",
];

export async function updatePaymentStatusController(req, res, next) {
  try {
    const { leadId } = req.params;
    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid payment status",
      });
    }

    const result = await pool.query(
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

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Payment record not found",
      });
    }

    await pool.query(
      `
      UPDATE intakes
      SET payment_status = $2
      WHERE lead_id = $1
      `,
      [leadId, status]
    );

    res.json({
      payment: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}
