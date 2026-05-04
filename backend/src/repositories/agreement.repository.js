import pool from "../db/pool.js";
import { query } from "../db/query.js";

export async function findLatestAgreementByLeadId(leadId, db = pool) {
  const { rows } = await query(db, 
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

export async function createAgreement(
  {
    id,
    leadId,
    title,
    htmlContent,
    status = "generated",
  },
  db = pool
) {
  await query(db, 
    `
    INSERT INTO agreements (
      id, lead_id, title, html_content, status
    ) VALUES ($1, $2, $3, $4, $5)
    `,
    [id, leadId, title, htmlContent, status]
  );
}
