import pool from "../db/pool.js";
import { query } from "../db/query.js";

function mapConflictCheckRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    lead_id: row.lead_id,
    potential_client_name: row.potential_client_name,
    potential_client_email: row.potential_client_email,
    opposing_party_names: row.opposing_party_names || [],
    related_person_names: row.related_person_names || [],
    case_summary: row.case_summary,
    matter_type: row.matter_type,
    jurisdiction_or_location: row.jurisdiction_or_location,
    notes: row.notes,
    result: row.result,
    submitted_at: row.submitted_at,
    reviewed_by: row.reviewed_by,
    reviewed_at: row.reviewed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function findConflictCheckByLeadId(leadId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT *
    FROM lead_conflict_checks
    WHERE lead_id = $1
    LIMIT 1
    `,
    [leadId]
  );

  return mapConflictCheckRow(rows[0] || null);
}

export async function upsertConflictCheck(
  {
    leadId,
    potentialClientName,
    potentialClientEmail,
    opposingPartyNames = [],
    relatedPersonNames = [],
    caseSummary,
    matterType,
    jurisdictionOrLocation,
    notes,
    result = "pending",
    submittedAt = null,
    reviewedBy = null,
    reviewedAt = null,
  },
  db = pool
) {
  const { rows } = await query(
    db,
    `
    INSERT INTO lead_conflict_checks (
      lead_id,
      potential_client_name,
      potential_client_email,
      opposing_party_names,
      related_person_names,
      case_summary,
      matter_type,
      jurisdiction_or_location,
      notes,
      result,
      submitted_at,
      reviewed_by,
      reviewed_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
    )
    ON CONFLICT (lead_id) DO UPDATE SET
      potential_client_name = EXCLUDED.potential_client_name,
      potential_client_email = EXCLUDED.potential_client_email,
      opposing_party_names = EXCLUDED.opposing_party_names,
      related_person_names = EXCLUDED.related_person_names,
      case_summary = EXCLUDED.case_summary,
      matter_type = EXCLUDED.matter_type,
      jurisdiction_or_location = EXCLUDED.jurisdiction_or_location,
      notes = EXCLUDED.notes,
      result = EXCLUDED.result,
      submitted_at = COALESCE(EXCLUDED.submitted_at, lead_conflict_checks.submitted_at),
      reviewed_by = COALESCE(EXCLUDED.reviewed_by, lead_conflict_checks.reviewed_by),
      reviewed_at = COALESCE(EXCLUDED.reviewed_at, lead_conflict_checks.reviewed_at),
      updated_at = NOW()
    RETURNING *
    `,
    [
      leadId,
      potentialClientName,
      potentialClientEmail,
      opposingPartyNames,
      relatedPersonNames,
      caseSummary || null,
      matterType,
      jurisdictionOrLocation || null,
      notes || null,
      result,
      submittedAt,
      reviewedBy,
      reviewedAt,
    ]
  );

  return mapConflictCheckRow(rows[0]);
}

export async function updateAttorneyReviewByLeadId(
  { leadId, status, reviewedBy, reviewNotes, responsibleAttorneyConfirmed = false },
  db = pool
) {
  const { rows } = await query(
    db,
    `
    UPDATE leads
    SET
      attorney_review_status = $2,
      attorney_reviewed_by = $3,
      attorney_reviewed_at = NOW(),
      attorney_review_notes = $4,
      responsible_attorney_confirmed = CASE
        WHEN $5 THEN TRUE
        ELSE responsible_attorney_confirmed
      END,
      updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING
      id,
      user_id,
      first_name,
      last_name,
      email,
      phone,
      status,
      attorney_review_status,
      attorney_reviewed_by,
      attorney_reviewed_at,
      attorney_review_notes,
      responsible_attorney_confirmed,
      created_at,
      updated_at
    `,
    [leadId, status, reviewedBy, reviewNotes || null, responsibleAttorneyConfirmed]
  );

  return rows[0] || null;
}

export async function markLegalRecommendationApproved(
  { leadId, approvedBy },
  db = pool
) {
  await query(
    db,
    `
    UPDATE intakes
    SET
      legal_recommendation_approved_by = $2,
      legal_recommendation_approved_at = NOW()
    WHERE lead_id = $1
    `,
    [leadId, approvedBy]
  );
}
