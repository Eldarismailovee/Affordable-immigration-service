import pool from "../db/pool.js";
import { query } from "../db/query.js";
import { APPROVED_PACKET_STATUS, DRAFT_PACKET_STATUS } from "../constants/domain.js";

const AGREEMENT_FIELDS =
  "id, lead_id, title, html_content, status, generated_at, approved_by, approved_at, review_notes, updated_at";

export async function findLatestAgreementByLeadId(leadId, db = pool) {
  const { rows } = await query(db,
    `
    SELECT ${AGREEMENT_FIELDS}
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
    status = DRAFT_PACKET_STATUS,
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

export async function approveAgreementByLeadId(
  { leadId, approvedBy, reviewNotes },
  db = pool
) {
  const { rows } = await query(db,
    `
    UPDATE agreements
    SET
      status = $2,
      approved_by = $3,
      approved_at = NOW(),
      review_notes = $4,
      updated_at = NOW()
    WHERE lead_id = $1
      AND status = $5
    RETURNING ${AGREEMENT_FIELDS}
    `,
    [leadId, APPROVED_PACKET_STATUS, approvedBy, reviewNotes || null, DRAFT_PACKET_STATUS]
  );

  return rows[0] || null;
}
