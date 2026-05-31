import pool from "../db/pool.js";
import { query } from "../db/query.js";

export async function findUserExportRow(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT
      id,
      email,
      full_name,
      role,
      status,
      email_verified_at,
      processing_restricted_at,
      processing_restriction_reason,
      created_at,
      updated_at
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
}

export async function listLeadsForUserExport(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT id, first_name, last_name, email, phone, status, created_at, updated_at
    FROM leads
    WHERE user_id = $1
    ORDER BY created_at DESC
    `,
    [userId]
  );

  return rows;
}

export async function listIntakesForUserLeads(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT
      i.id,
      i.lead_id,
      i.selected_package,
      i.case_type,
      i.notes,
      i.additional_i130_count,
      i.expedited,
      i.pricing_min,
      i.pricing_max,
      i.agreement_status,
      i.booking_status,
      i.payment_status,
      i.docketwise_status,
      i.submitted_at,
      i.created_at,
      i.updated_at
    FROM intakes i
    INNER JOIN leads l ON l.id = i.lead_id
    WHERE l.user_id = $1
    ORDER BY i.created_at DESC
    `,
    [userId]
  );

  return rows;
}

export async function listAgreementsForUserLeads(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT
      a.id,
      a.lead_id,
      a.title,
      a.status,
      a.generated_at,
      a.approved_at,
      a.updated_at
    FROM agreements a
    INNER JOIN leads l ON l.id = a.lead_id
    WHERE l.user_id = $1
    ORDER BY a.generated_at DESC
    `,
    [userId]
  );

  return rows;
}

export async function listOnboardingForUserLeads(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT
      op.id,
      op.lead_id,
      op.title,
      op.status,
      op.generated_at,
      op.approved_at,
      op.updated_at
    FROM onboarding_packets op
    INNER JOIN leads l ON l.id = op.lead_id
    WHERE l.user_id = $1
    ORDER BY op.generated_at DESC
    `,
    [userId]
  );

  return rows;
}

export async function listBookingsForUserLeads(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT
      b.id,
      b.lead_id,
      b.consultation_type,
      b.preferred_date_time,
      b.status,
      b.created_at,
      b.updated_at
    FROM bookings b
    INNER JOIN leads l ON l.id = b.lead_id
    WHERE l.user_id = $1
    ORDER BY b.created_at DESC
    `,
    [userId]
  );

  return rows;
}

export async function listPaymentsForUserLeads(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT
      p.id,
      p.lead_id,
      p.amount_min,
      p.amount_max,
      p.status,
      p.manual_review,
      p.billing_name,
      p.billing_email,
      p.payment_preference,
      p.created_at,
      p.updated_at
    FROM payments p
    INNER JOIN leads l ON l.id = p.lead_id
    WHERE l.user_id = $1
    ORDER BY p.created_at DESC
    `,
    [userId]
  );

  return rows;
}

export async function listDocketwiseForUserLeads(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT
      d.id,
      d.lead_id,
      d.external_id,
      d.status,
      d.last_synced_at,
      d.created_at,
      d.updated_at
    FROM docketwise_sync d
    INNER JOIN leads l ON l.id = d.lead_id
    WHERE l.user_id = $1
    ORDER BY d.created_at DESC
    `,
    [userId]
  );

  return rows;
}

export async function listDsarRequestsForUserExport(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT
      id,
      request_type,
      status,
      identity_verification_status,
      legal_hold,
      user_message,
      created_at,
      updated_at,
      completed_at
    FROM dsar_requests
    WHERE requester_user_id = $1
    ORDER BY created_at DESC
    `,
    [userId]
  );

  return rows;
}
