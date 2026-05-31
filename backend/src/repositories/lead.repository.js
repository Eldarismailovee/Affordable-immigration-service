import pool from "../db/pool.js";
import { query } from "../db/query.js";
import { DECLINED_LEAD_STATUS } from "../constants/domain.js";
import { ATTORNEY_VISIBLE_LEAD_STATES } from "../domain/lead-state.policy.js";

export async function listLeadSummaries({ userId, attorneyVisibleOnly = false } = {}, db = pool) {
  const params = [];
  const filters = ["l.deleted_at IS NULL"];

  if (userId) {
    params.push(userId);
    filters.push(`l.user_id = $${params.length}`);
  }

  if (attorneyVisibleOnly) {
    params.push(ATTORNEY_VISIBLE_LEAD_STATES);
    filters.push(`l.status = ANY($${params.length}::text[])`);
  }

  const whereClause = `WHERE ${filters.join(" AND ")}`;

  const { rows } = await query(db, 
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
      i.agreement_status,
      i.booking_status,
      i.payment_status,
      COALESCE(ds.status, i.docketwise_status) AS docketwise_status,
      ds.external_id AS docketwise_external_id,
      i.pricing_min,
      i.pricing_max,
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
    LEFT JOIN LATERAL (
      SELECT *
      FROM docketwise_sync ds
      WHERE ds.lead_id = l.id
      ORDER BY ds.created_at DESC
      LIMIT 1
    ) ds ON TRUE
    ${whereClause}
    ORDER BY l.created_at DESC
    LIMIT 100
    `,
    params
  );

  return rows;
}

export async function findLeadById(leadId, db = pool) {
  const { rows } = await query(db, 
    `
    SELECT id, user_id, first_name, last_name, email, phone, status, created_at, updated_at
    FROM leads
    WHERE id = $1
      AND deleted_at IS NULL
    LIMIT 1
    `,
    [leadId]
  );

  return rows[0] || null;
}

export async function softDeleteLeadById(leadId, db = pool) {
  const { rows } = await query(db, 
    `
    UPDATE leads
    SET
      status = $2,
      deleted_at = COALESCE(deleted_at, NOW()),
      updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING id, user_id, first_name, last_name, email, phone, status, created_at, updated_at
    `,
    [leadId, DECLINED_LEAD_STATUS]
  );

  return rows[0] || null;
}

export async function createLead(
  {
    id,
    userId,
    firstName,
    lastName,
    email,
    phone,
    status = "prospective",
  },
  db = pool
) {
  await query(db, 
    `
    INSERT INTO leads (
      id, user_id, first_name, last_name, email, phone, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [id, userId || null, firstName, lastName, email, phone, status]
  );
}

export async function createIntakeRecord(
  {
    id,
    leadId,
    selectedPackage,
    caseType,
    notes,
    additionalI130Count,
    expedited,
    pricingMin,
    pricingMax,
    agreementStatus = "generated",
    bookingStatus = "requested",
    paymentStatus = "pending_manual_processing",
    docketwiseStatus = "not_synced",
  },
  db = pool
) {
  await query(db, 
    `
    INSERT INTO intakes (
      id,
      lead_id,
      selected_package,
      case_type,
      notes,
      additional_i130_count,
      expedited,
      pricing_min,
      pricing_max,
      agreement_status,
      booking_status,
      payment_status,
      docketwise_status
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
    )
    `,
    [
      id,
      leadId,
      selectedPackage,
      caseType,
      notes || "",
      Number(additionalI130Count || 0),
      Boolean(expedited),
      pricingMin,
      pricingMax,
      agreementStatus,
      bookingStatus,
      paymentStatus,
      docketwiseStatus,
    ]
  );
}

export async function createBookingRecord(
  {
    id,
    leadId,
    consultationType,
    preferredDateTime,
    status = "requested",
  },
  db = pool
) {
  await query(db, 
    `
    INSERT INTO bookings (
      id, lead_id, consultation_type, preferred_date_time, status
    ) VALUES ($1, $2, $3, $4, $5)
    `,
    [id, leadId, consultationType, preferredDateTime, status]
  );
}

export async function findLatestIntakeByLeadId(leadId, db = pool) {
  const { rows } = await query(db, 
    `
    SELECT
      id,
      lead_id,
      selected_package,
      case_type,
      notes,
      additional_i130_count,
      expedited,
      pricing_min,
      pricing_max,
      agreement_status,
      booking_status,
      payment_status,
      docketwise_status,
      submitted_at,
      created_at
    FROM intakes
    WHERE lead_id = $1
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [leadId]
  );

  return rows[0] || null;
}

export async function findLatestBookingByLeadId(leadId, db = pool) {
  const { rows } = await query(db, 
    `
    SELECT
      id,
      lead_id,
      consultation_type,
      preferred_date_time,
      status,
      created_at
    FROM bookings
    WHERE lead_id = $1
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [leadId]
  );

  return rows[0] || null;
}

export async function findLatestPaymentByLeadId(leadId, db = pool) {
  const { rows } = await query(db, 
    `
    SELECT
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
    FROM payments
    WHERE lead_id = $1
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [leadId]
  );

  return rows[0] || null;
}

export async function updateIntakeAgreementStatusByLeadId(leadId, status, db = pool) {
  await query(db, 
    `
    UPDATE intakes
    SET agreement_status = $2
    WHERE lead_id = $1
    `,
    [leadId, status]
  );
}

export async function updateIntakeDocketwiseStatusByLeadId(leadId, status, db = pool) {
  await query(db, 
    `
    UPDATE intakes
    SET docketwise_status = $2
    WHERE lead_id = $1
    `,
    [leadId, status]
  );
}

export async function findLatestDocketwiseSyncByLeadId(leadId, db = pool) {
  const { rows } = await query(db, 
    `
    SELECT
      id,
      lead_id,
      external_id,
      status,
      error_message,
      last_synced_at,
      created_at
    FROM docketwise_sync
    WHERE lead_id = $1
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [leadId]
  );

  return rows[0] || null;
}

export async function updateLeadStateById(leadId, state, db = pool) {
  const { rows } = await query(db,
    `
    UPDATE leads
    SET
      status = $2,
      updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING id, user_id, first_name, last_name, email, phone, status, created_at, updated_at
    `,
    [leadId, state]
  );

  return rows[0] || null;
}

export async function updateLeadContactById(
  { leadId, firstName, lastName, phone, email },
  db = pool
) {
  const { rows } = await query(
    db,
    `
    UPDATE leads
    SET
      first_name = COALESCE($2, first_name),
      last_name = COALESCE($3, last_name),
      phone = COALESCE($4, phone),
      email = COALESCE($5, email),
      updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING id, user_id, first_name, last_name, email, phone, status, created_at, updated_at
    `,
    [leadId, firstName ?? null, lastName ?? null, phone ?? null, email ?? null]
  );

  return rows[0] || null;
}

export async function anonymizeLeadsForUserId(userId, db = pool) {
  await query(
    db,
    `
    UPDATE leads
    SET
      first_name = 'Deleted',
      last_name = 'User',
      email = 'anonymized+' || id::text || '@deleted.local',
      phone = '0000000000',
      updated_at = NOW()
    WHERE user_id = $1
      AND deleted_at IS NULL
    `,
    [userId]
  );
}

export async function findLatestLeadByUserId(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT id, user_id, first_name, last_name, email, phone, status, created_at, updated_at
    FROM leads
    WHERE user_id = $1
      AND deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
}
