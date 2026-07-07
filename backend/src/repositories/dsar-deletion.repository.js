import pool from "../db/pool.js";
import { query } from "../db/query.js";

export async function listLeadIdsForUser(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT id
    FROM leads
    WHERE user_id = $1
    `,
    [userId]
  );

  return rows.map((row) => row.id);
}

export async function anonymizeIntakesForUserLeads(userId, db = pool) {
  await query(
    db,
    `
    UPDATE intakes i
    SET
      case_type = 'redacted',
      notes = NULL,
      petition_relationship = NULL,
      location = NULL,
      has_urgent_deadline = FALSE,
      urgent_deadline_notes = NULL,
      updated_at = NOW()
    FROM leads l
    WHERE i.lead_id = l.id
      AND l.user_id = $1
    `,
    [userId]
  );
}

export async function anonymizeBookingsForUserLeads(userId, db = pool) {
  await query(
    db,
    `
    UPDATE bookings b
    SET
      preferred_date_time = 'redacted',
      updated_at = NOW()
    FROM leads l
    WHERE b.lead_id = l.id
      AND l.user_id = $1
    `,
    [userId]
  );
}

export async function anonymizePaymentsForUserLeads(userId, db = pool) {
  await query(
    db,
    `
    UPDATE payments p
    SET
      billing_name = 'Deleted User',
      billing_email = 'anonymized+' || p.lead_id::text || '@deleted.local',
      notes = NULL,
      notes_redacted = TRUE,
      hosted_payment_url = NULL,
      provider_reference = NULL,
      updated_at = NOW()
    FROM leads l
    WHERE p.lead_id = l.id
      AND l.user_id = $1
    `,
    [userId]
  );
}

export async function anonymizeAgreementsForUserLeads(userId, db = pool) {
  await query(
    db,
    `
    UPDATE agreements a
    SET
      html_content = '<p>Content removed per privacy deletion request.</p>',
      title = 'Removed',
      updated_at = NOW()
    FROM leads l
    WHERE a.lead_id = l.id
      AND l.user_id = $1
    `,
    [userId]
  );
}

export async function anonymizeOnboardingForUserLeads(userId, db = pool) {
  await query(
    db,
    `
    UPDATE onboarding_packets op
    SET
      html_content = '<p>Content removed per privacy deletion request.</p>',
      title = 'Removed',
      updated_at = NOW()
    FROM leads l
    WHERE op.lead_id = l.id
      AND l.user_id = $1
    `,
    [userId]
  );
}

export async function anonymizeConflictChecksForUserLeads(userId, db = pool) {
  await query(
    db,
    `
    UPDATE lead_conflict_checks c
    SET
      potential_client_name = 'Deleted User',
      potential_client_email = 'anonymized+' || c.lead_id::text || '@deleted.local',
      opposing_party_names = '{}',
      related_person_names = '{}',
      case_summary = NULL,
      notes = NULL,
      updated_at = NOW()
    FROM leads l
    WHERE c.lead_id = l.id
      AND l.user_id = $1
    `,
    [userId]
  );
}

export async function clearDocketwiseForUserLeads(userId, db = pool) {
  await query(
    db,
    `
    UPDATE docketwise_sync d
    SET
      external_id = NULL,
      status = 'not_configured',
      error_message = 'Cleared during privacy deletion',
      last_synced_at = NULL,
      updated_at = NOW()
    FROM leads l
    WHERE d.lead_id = l.id
      AND l.user_id = $1
    `,
    [userId]
  );

  await query(
    db,
    `
    UPDATE intakes i
    SET docketwise_status = 'not_configured', updated_at = NOW()
    FROM leads l
    WHERE i.lead_id = l.id
      AND l.user_id = $1
    `,
    [userId]
  );
}

export async function deleteAuthTokensForUser(userId, db = pool) {
  await query(
    db,
    `DELETE FROM email_verification_tokens WHERE user_id = $1`,
    [userId]
  );
  await query(
    db,
    `DELETE FROM password_reset_tokens WHERE user_id = $1`,
    [userId]
  );
}

export async function deleteEmailSuppressionsForUser(userId, db = pool) {
  await query(db, `DELETE FROM email_suppressions WHERE user_id = $1`, [userId]);
}

export async function anonymizeCookieConsentForUser(userId, db = pool) {
  await query(
    db,
    `
    UPDATE cookie_consent_logs
    SET
      anonymous_id = NULL,
      ip_hash = NULL,
      user_agent = NULL,
      consent_json = '{}'::jsonb
    WHERE user_id = $1
    `,
    [userId]
  );
}

export async function anonymizeDsarRequestsForUser(userId, excludeRequestId = null, db = pool) {
  await query(
    db,
    `
    UPDATE dsar_requests
    SET
      requester_email = 'anonymized+' || id::text || '@deleted.local',
      user_message = NULL,
      requested_changes = NULL,
      export_payload_json = NULL,
      export_pdf_path = NULL,
      admin_notes = NULL,
      updated_at = NOW()
    WHERE requester_user_id = $1
      AND ($2::uuid IS NULL OR id <> $2)
    `,
    [userId, excludeRequestId]
  );
}

export async function listDsarExportPathsForUser(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT export_pdf_path
    FROM dsar_requests
    WHERE requester_user_id = $1
      AND export_pdf_path IS NOT NULL
    `,
    [userId]
  );

  return rows.map((row) => row.export_pdf_path).filter(Boolean);
}

export async function clearCurrentDsarRequestPii(requestId, db = pool) {
  await query(
    db,
    `
    UPDATE dsar_requests
    SET
      requester_email = 'anonymized+' || id::text || '@deleted.local',
      user_message = NULL,
      requested_changes = NULL,
      export_payload_json = NULL,
      export_pdf_path = NULL,
      updated_at = NOW()
    WHERE id = $1
    `,
    [requestId]
  );
}

export async function deleteIntakeDraftsForUser(userId, db = pool) {
  await query(
    db,
    `
    DELETE FROM intake_drafts
    WHERE user_id = $1
    `,
    [userId]
  );
}

export async function findRemainingPiiIndicators(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    WITH lead_ids AS (
      SELECT id FROM leads WHERE user_id = $1 AND deleted_at IS NULL
    )
    SELECT
      (SELECT COUNT(*)::int FROM users u
        WHERE u.id = $1
          AND u.deleted_at IS NULL
          AND u.email NOT LIKE 'anonymized+%@deleted.local') AS active_user_identity,
      (SELECT COUNT(*)::int FROM leads l
        WHERE l.user_id = $1
          AND l.deleted_at IS NULL
          AND l.email NOT LIKE 'anonymized+%@deleted.local') AS lead_contact_pii,
      (SELECT COUNT(*)::int FROM intakes i
        JOIN lead_ids li ON li.id = i.lead_id
        WHERE COALESCE(i.notes, '') <> ''
           OR COALESCE(i.petition_relationship, '') <> ''
           OR COALESCE(i.location, '') <> ''
           OR COALESCE(i.urgent_deadline_notes, '') <> ''
           OR i.case_type <> 'redacted') AS intake_pii,
      (SELECT COUNT(*)::int FROM payments p
        JOIN lead_ids li ON li.id = p.lead_id
        WHERE COALESCE(p.notes, '') <> ''
           OR p.billing_email NOT LIKE 'anonymized+%@deleted.local') AS payment_pii,
      (SELECT COUNT(*)::int FROM bookings b
        JOIN lead_ids li ON li.id = b.lead_id
        WHERE b.preferred_date_time <> 'redacted') AS booking_pii,
      (SELECT COUNT(*)::int FROM agreements a
        JOIN lead_ids li ON li.id = a.lead_id
        WHERE a.html_content NOT LIKE '%removed per privacy deletion%') AS agreement_pii,
      (SELECT COUNT(*)::int FROM onboarding_packets op
        JOIN lead_ids li ON li.id = op.lead_id
        WHERE op.html_content NOT LIKE '%removed per privacy deletion%') AS onboarding_pii,
      (SELECT COUNT(*)::int FROM auth_refresh_tokens t
        WHERE t.user_id = $1 AND t.revoked_at IS NULL AND t.expires_at > NOW()) AS active_refresh_tokens,
      (SELECT COUNT(*)::int FROM email_verification_tokens t
        WHERE t.user_id = $1) AS verification_tokens,
      (SELECT COUNT(*)::int FROM password_reset_tokens t
        WHERE t.user_id = $1) AS reset_tokens,
      (SELECT COUNT(*)::int FROM dsar_requests d
        WHERE d.requester_user_id = $1
          AND (
            COALESCE(d.user_message, '') <> ''
            OR d.export_payload_json IS NOT NULL
            OR d.export_pdf_path IS NOT NULL
            OR d.requester_email NOT LIKE 'anonymized+%@deleted.local'
          )) AS dsar_request_pii,
      (SELECT COUNT(*)::int FROM intake_drafts id
        WHERE id.user_id = $1
          AND id.submitted_at IS NULL
          AND id.draft_data <> '{}'::jsonb) AS intake_draft_pii
    `,
    [userId]
  );

  return rows[0] || {};
}