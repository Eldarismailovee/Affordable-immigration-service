import pool from "../db/pool.js";
import { query } from "../db/query.js";
import { RETENTION_DELETED_REASON } from "../constants/retention.js";

function clampLimit(limit) {
  return Math.min(Math.max(Number(limit) || 100, 1), 1000);
}

export async function findDueCookieConsentLogs(cutoff, limit = 100, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT id, created_at
    FROM cookie_consent_logs
    WHERE created_at < $1
    ORDER BY created_at ASC
    LIMIT $2
    `,
    [cutoff, clampLimit(limit)],
    { name: "retention.find_due_cookie_consent_logs" }
  );
  return rows;
}

export async function deleteCookieConsentLogsByIds(ids, db = pool) {
  if (!ids.length) return 0;
  const { rowCount } = await query(
    db,
    `DELETE FROM cookie_consent_logs WHERE id = ANY($1::uuid[])`,
    [ids],
    { name: "retention.delete_cookie_consent_logs" }
  );
  return rowCount ?? 0;
}

export async function findDueExpiredOneTimeTokens(limit = 100, db = pool) {
  const safeLimit = clampLimit(limit);
  const { rows } = await query(
    db,
    `
    (
      SELECT id, 'email_verification' AS token_type, expires_at
      FROM email_verification_tokens
      WHERE expires_at < NOW()
      ORDER BY expires_at ASC
      LIMIT $1
    )
    UNION ALL
    (
      SELECT id, 'password_reset' AS token_type, expires_at
      FROM password_reset_tokens
      WHERE expires_at < NOW()
      ORDER BY expires_at ASC
      LIMIT $1
    )
    `,
    [safeLimit],
    { name: "retention.find_due_one_time_tokens" }
  );
  return rows;
}

export async function deleteEmailVerificationTokensByIds(ids, db = pool) {
  if (!ids.length) return 0;
  const { rowCount } = await query(
    db,
    `DELETE FROM email_verification_tokens WHERE id = ANY($1::uuid[])`,
    [ids],
    { name: "retention.delete_email_verification_tokens" }
  );
  return rowCount ?? 0;
}

export async function deletePasswordResetTokensByIds(ids, db = pool) {
  if (!ids.length) return 0;
  const { rowCount } = await query(
    db,
    `DELETE FROM password_reset_tokens WHERE id = ANY($1::uuid[])`,
    [ids],
    { name: "retention.delete_password_reset_tokens" }
  );
  return rowCount ?? 0;
}

export async function findDueAuditEvents(cutoff, limit = 100, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT id, legal_hold, created_at, retention_until, scheduled_anonymization_at, anonymized_at
    FROM audit_events
    WHERE anonymized_at IS NULL
      AND (
        (legal_hold = TRUE)
        OR (
          legal_hold = FALSE
          AND (
            (retention_until IS NOT NULL AND retention_until <= NOW())
            OR (retention_until IS NULL AND created_at < $1)
            OR (scheduled_anonymization_at IS NOT NULL AND scheduled_anonymization_at <= NOW())
          )
        )
      )
    ORDER BY created_at ASC
    LIMIT $2
    `,
    [cutoff, clampLimit(limit)],
    { name: "retention.find_due_audit_events" }
  );
  return rows;
}

export async function anonymizeAuditEventsByIds(ids, db = pool) {
  if (!ids.length) return 0;
  const { rowCount } = await query(
    db,
    `
    UPDATE audit_events
    SET
      ip_hash = NULL,
      user_agent = NULL,
      metadata_json = '{}'::jsonb,
      anonymized_at = NOW(),
      deleted_reason = $2
    WHERE id = ANY($1::uuid[])
      AND legal_hold = FALSE
      AND anonymized_at IS NULL
    `,
    [ids, RETENTION_DELETED_REASON],
    { name: "retention.anonymize_audit_events" }
  );
  return rowCount ?? 0;
}

export async function findDueAdminAuditLogs(cutoff, limit = 100, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT id, created_at
    FROM admin_audit_log
    WHERE created_at < $1
    ORDER BY created_at ASC
    LIMIT $2
    `,
    [cutoff, clampLimit(limit)],
    { name: "retention.find_due_admin_audit_logs" }
  );
  return rows;
}

export async function deleteAdminAuditLogsByIds(ids, db = pool) {
  if (!ids.length) return 0;
  const { rowCount } = await query(
    db,
    `DELETE FROM admin_audit_log WHERE id = ANY($1::uuid[])`,
    [ids],
    { name: "retention.delete_admin_audit_log" }
  );
  return rowCount ?? 0;
}

export async function findExpiredRefreshTokens(limit = 100, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT id, expires_at, revoked_at
    FROM auth_refresh_tokens
    WHERE expires_at < NOW()
    ORDER BY expires_at ASC
    LIMIT $1
    `,
    [clampLimit(limit)],
    { name: "retention.find_expired_refresh_tokens" }
  );
  return rows;
}

export async function findRevokedRefreshTokensOlderThan(cutoff, limit = 100, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT id, revoked_at, expires_at
    FROM auth_refresh_tokens
    WHERE revoked_at IS NOT NULL
      AND revoked_at < $1
    ORDER BY revoked_at ASC
    LIMIT $2
    `,
    [cutoff, clampLimit(limit)],
    { name: "retention.find_revoked_refresh_tokens" }
  );
  return rows;
}

export async function deleteRefreshTokensByIds(ids, db = pool) {
  if (!ids.length) return 0;
  const { rowCount } = await query(
    db,
    `DELETE FROM auth_refresh_tokens WHERE id = ANY($1::uuid[])`,
    [ids],
    { name: "retention.delete_refresh_tokens" }
  );
  return rowCount ?? 0;
}

export async function findInactiveLeadsDueForAnonymization(cutoff, limit = 100, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT
      id,
      status,
      legal_hold,
      updated_at,
      retention_until,
      scheduled_anonymization_at,
      anonymized_at,
      deleted_at
    FROM leads
    WHERE deleted_at IS NULL
      AND anonymized_at IS NULL
      AND status IN ('new', 'declined')
      AND (
        legal_hold = TRUE
        OR (
          legal_hold = FALSE
          AND (
            (scheduled_anonymization_at IS NOT NULL AND scheduled_anonymization_at <= NOW())
            OR (retention_until IS NOT NULL AND retention_until <= NOW())
            OR (retention_until IS NULL AND updated_at < $1)
          )
        )
      )
    ORDER BY updated_at ASC
    LIMIT $2
    `,
    [cutoff, clampLimit(limit)],
    { name: "retention.find_inactive_leads" }
  );
  return rows;
}

export async function anonymizeLeadById(leadId, db = pool) {
  const { rowCount } = await query(
    db,
    `
    UPDATE leads
    SET
      first_name = 'Deleted',
      last_name = 'Lead',
      email = 'anonymized+' || id::text || '@deleted.local',
      phone = NULL,
      attorney_review_notes = NULL,
      anonymized_at = NOW(),
      deleted_reason = $2,
      updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
      AND anonymized_at IS NULL
      AND legal_hold = FALSE
    `,
    [leadId, RETENTION_DELETED_REASON],
    { name: "retention.anonymize_lead" }
  );

  if ((rowCount ?? 0) === 0) {
    return 0;
  }

  await query(
    db,
    `
    UPDATE intakes
    SET notes = NULL, updated_at = NOW()
    WHERE lead_id = $1
    `,
    [leadId],
    { name: "retention.anonymize_lead_intakes" }
  );

  await query(
    db,
    `
    UPDATE lead_conflict_checks
    SET
      potential_client_name = 'Deleted Lead',
      potential_client_email = 'anonymized+' || lead_id::text || '@deleted.local',
      opposing_party_names = '{}',
      related_person_names = '{}',
      case_summary = NULL,
      notes = NULL,
      updated_at = NOW()
    WHERE lead_id = $1
    `,
    [leadId],
    { name: "retention.anonymize_lead_conflict_checks" }
  );

  return rowCount ?? 0;
}

export async function findDocumentsDueForRetention(cutoff, limit = 100, db = pool) {
  const safeLimit = clampLimit(limit);
  const { rows } = await query(
    db,
    `
    (
      SELECT
        a.id,
        'agreement' AS document_type,
        a.legal_hold,
        a.status,
        a.generated_at AS created_at,
        a.retention_until,
        a.scheduled_anonymization_at,
        a.anonymized_at,
        l.status AS lead_status,
        l.legal_hold AS lead_legal_hold
      FROM agreements a
      JOIN leads l ON l.id = a.lead_id
      WHERE a.anonymized_at IS NULL
        AND l.deleted_at IS NULL
        AND (
          a.legal_hold = TRUE
          OR l.legal_hold = TRUE
          OR (
            a.legal_hold = FALSE
            AND l.legal_hold = FALSE
            AND NOT (a.status = 'approved' AND l.status IN ('engaged', 'filed', 'accepted'))
            AND (
              (a.scheduled_anonymization_at IS NOT NULL AND a.scheduled_anonymization_at <= NOW())
              OR (a.retention_until IS NOT NULL AND a.retention_until <= NOW())
              OR (a.retention_until IS NULL AND a.generated_at < $1)
            )
          )
        )
      ORDER BY a.generated_at ASC
      LIMIT $2
    )
    UNION ALL
    (
      SELECT
        op.id,
        'onboarding_packet' AS document_type,
        op.legal_hold,
        op.status,
        op.generated_at AS created_at,
        op.retention_until,
        op.scheduled_anonymization_at,
        op.anonymized_at,
        l.status AS lead_status,
        l.legal_hold AS lead_legal_hold
      FROM onboarding_packets op
      JOIN leads l ON l.id = op.lead_id
      WHERE op.anonymized_at IS NULL
        AND l.deleted_at IS NULL
        AND (
          op.legal_hold = TRUE
          OR l.legal_hold = TRUE
          OR (
            op.legal_hold = FALSE
            AND l.legal_hold = FALSE
            AND NOT (op.status = 'approved' AND l.status IN ('engaged', 'filed', 'accepted'))
            AND (
              (op.scheduled_anonymization_at IS NOT NULL AND op.scheduled_anonymization_at <= NOW())
              OR (op.retention_until IS NOT NULL AND op.retention_until <= NOW())
              OR (op.retention_until IS NULL AND op.generated_at < $1)
            )
          )
        )
      ORDER BY op.generated_at ASC
      LIMIT $2
    )
    `,
    [cutoff, safeLimit],
    { name: "retention.find_due_documents" }
  );
  return rows;
}

export async function anonymizeAgreementById(id, db = pool) {
  const { rowCount } = await query(
    db,
    `
    UPDATE agreements
    SET
      title = 'deleted-file',
      html_content = '',
      review_notes = NULL,
      anonymized_at = NOW(),
      deleted_reason = $2,
      updated_at = NOW()
    WHERE id = $1
      AND anonymized_at IS NULL
      AND legal_hold = FALSE
    `,
    [id, RETENTION_DELETED_REASON],
    { name: "retention.anonymize_agreement" }
  );
  return rowCount ?? 0;
}

export async function anonymizeOnboardingPacketById(id, db = pool) {
  const { rowCount } = await query(
    db,
    `
    UPDATE onboarding_packets
    SET
      title = 'deleted-file',
      html_content = '',
      review_notes = NULL,
      anonymized_at = NOW(),
      deleted_reason = $2,
      updated_at = NOW()
    WHERE id = $1
      AND anonymized_at IS NULL
      AND legal_hold = FALSE
    `,
    [id, RETENTION_DELETED_REASON],
    { name: "retention.anonymize_onboarding_packet" }
  );
  return rowCount ?? 0;
}

const RETENTION_TABLES = {
  security_audit: "audit_events",
  lead: "leads",
  document_agreement: "agreements",
  document_onboarding: "onboarding_packets",
};

export async function updateRetentionOverride({
  tableKey,
  id,
  retentionUntil,
  scheduledAnonymizationAt,
  legalHold,
  legalHoldReason,
  reason,
  actorUserId,
  db = pool,
}) {
  const table = RETENTION_TABLES[tableKey];
  if (!table) {
    throw new Error(`Unsupported retention table: ${tableKey}`);
  }

  const sets = [
    "retention_override_reason = $2",
    "retention_overridden_by = $3",
    "retention_overridden_at = NOW()",
  ];
  const params = [id, reason, actorUserId];
  let index = 4;

  if (retentionUntil !== undefined) {
    sets.push(`retention_until = $${index++}`);
    params.push(retentionUntil);
  }

  if (scheduledAnonymizationAt !== undefined) {
    sets.push(`scheduled_anonymization_at = $${index++}`);
    params.push(scheduledAnonymizationAt);
  }

  if (legalHold !== undefined && legalHold !== null) {
    sets.push(`legal_hold = $${index++}`);
    params.push(legalHold);
    sets.push(`legal_hold_reason = $${index++}`);
    params.push(legalHold ? legalHoldReason ?? reason : null);
  }

  const { rows } = await query(
    db,
    `
    UPDATE ${table}
    SET ${sets.join(", ")}
    WHERE id = $1
    RETURNING id
    `,
    params,
    { name: "retention.update_override" }
  );

  return rows[0] || null;
}

export async function findRetentionTarget(category, targetId, db = pool) {
  if (category === "security_audit") {
    const { rows } = await query(
      db,
      `SELECT id, legal_hold FROM audit_events WHERE id = $1`,
      [targetId],
      { name: "retention.find_audit_target" }
    );
    return rows[0] || null;
  }

  if (category === "lead") {
    const { rows } = await query(
      db,
      `SELECT id, legal_hold FROM leads WHERE id = $1 AND deleted_at IS NULL`,
      [targetId],
      { name: "retention.find_lead_target" }
    );
    return rows[0] || null;
  }

  if (category === "document") {
    const { rows } = await query(
      db,
      `
      SELECT id, legal_hold, 'agreement' AS document_type FROM agreements WHERE id = $1
      UNION ALL
      SELECT id, legal_hold, 'onboarding_packet' AS document_type FROM onboarding_packets WHERE id = $1
      LIMIT 1
      `,
      [targetId],
      { name: "retention.find_document_target" }
    );
    return rows[0] || null;
  }

  return null;
}

export async function applyDocumentRetentionOverride({
  targetId,
  documentType,
  retentionUntil,
  scheduledAnonymizationAt,
  legalHold,
  legalHoldReason,
  reason,
  actorUserId,
  db = pool,
}) {
  const tableKey =
    documentType === "onboarding_packet" ? "document_onboarding" : "document_agreement";
  return updateRetentionOverride({
    tableKey,
    id: targetId,
    retentionUntil,
    scheduledAnonymizationAt,
    legalHold,
    legalHoldReason,
    reason,
    actorUserId,
    db,
  });
}

// Backward-compatible bulk deletes used by legacy cleanup entry points.
export async function deleteAuditEventsOlderThan(cutoff, db = pool) {
  const rows = await findDueAuditEvents(cutoff, 1000, db);
  const eligible = rows.filter((row) => !row.legal_hold).map((row) => row.id);
  return anonymizeAuditEventsByIds(eligible, db);
}

export async function deleteAdminAuditLogsOlderThan(cutoff, db = pool) {
  const rows = await findDueAdminAuditLogs(cutoff, 1000, db);
  return deleteAdminAuditLogsByIds(
    rows.map((row) => row.id),
    db
  );
}

export async function deleteCookieConsentLogsOlderThan(cutoff, db = pool) {
  const rows = await findDueCookieConsentLogs(cutoff, 1000, db);
  return deleteCookieConsentLogsByIds(
    rows.map((row) => row.id),
    db
  );
}

export async function deleteExpiredAuthRefreshTokens(db = pool) {
  const rows = await findExpiredRefreshTokens(1000, db);
  return deleteRefreshTokensByIds(
    rows.map((row) => row.id),
    db
  );
}
