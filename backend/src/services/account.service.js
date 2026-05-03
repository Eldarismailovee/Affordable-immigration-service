import pool from "../db/pool.js";

export async function listAccountLeads(userId) {
  const { rows } = await pool.query(
    `
    SELECT
      l.id,
      l.first_name,
      l.last_name,
      l.email,
      l.phone,
      l.status,
      l.created_at,
      i.selected_package,
      i.case_type,
      i.pricing_min,
      i.pricing_max,
      i.agreement_status,
      i.booking_status,
      i.payment_status,
      op.status AS onboarding_status,
      ag.status AS agreement_document_status
    FROM leads l
    LEFT JOIN LATERAL (
      SELECT *
      FROM intakes i
      WHERE i.lead_id = l.id
      ORDER BY i.created_at DESC
      LIMIT 1
    ) i ON TRUE
    LEFT JOIN LATERAL (
      SELECT *
      FROM onboarding_packets op
      WHERE op.lead_id = l.id
      ORDER BY op.generated_at DESC
      LIMIT 1
    ) op ON TRUE
    LEFT JOIN LATERAL (
      SELECT *
      FROM agreements ag
      WHERE ag.lead_id = l.id
      ORDER BY ag.generated_at DESC
      LIMIT 1
    ) ag ON TRUE
    WHERE l.user_id = $1
    ORDER BY l.created_at DESC
    LIMIT 100
    `,
    [userId]
  );

  return rows;
}
