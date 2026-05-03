import pool from "../db/pool.js";

export async function findLatestAgreementByLeadId(leadId, db = pool) {
  const { rows } = await db.query(
    `
    SELECT id, lead_id, title, html_content, status, generated_at
    FROM agreements
    WHERE lead_id = $1
    ORDER BY generated_at DESC
    LIMIT 1
    `,
    [leadId]
  );

  return rows[0] || null;
}
