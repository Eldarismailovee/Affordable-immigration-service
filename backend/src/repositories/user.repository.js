import { randomUUID } from "crypto";
import pool from "../db/pool.js";
import { query } from "../db/query.js";

const SAFE_USER_FIELDS =
  "id, email, full_name, role, status, email_verified_at, pending_email, pending_email_requested_at, email_changed_at, processing_restricted_at, processing_restriction_reason, marketing_consent, newsletter_consent, marketing_consent_at, marketing_consent_source, marketing_opt_out_at, marketing_opt_out_reason, session_security_version, created_at, updated_at";
const AUTH_USER_FIELDS = `${SAFE_USER_FIELDS}, password_hash`;

export async function findUserByEmail(email, db = pool) {
  const { rows } = await query(db, 
    `
    SELECT ${AUTH_USER_FIELDS}
    FROM users
    WHERE LOWER(email) = LOWER($1)
      AND deleted_at IS NULL
    LIMIT 1
    `,
    [email]
  );

  return rows[0] || null;
}

export async function findUserById(userId, db = pool) {
  const { rows } = await query(db, 
    `
    SELECT ${SAFE_USER_FIELDS}
    FROM users
    WHERE id = $1
      AND deleted_at IS NULL
    LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
}

export async function countUsers(db = pool) {
  const { rows } = await query(db, 
    "SELECT COUNT(*)::int AS total FROM users WHERE deleted_at IS NULL"
  );
  return rows[0]?.total || 0;
}

export async function countActiveAdmins(db = pool) {
  const { rows } = await query(db, 
    `
    SELECT COUNT(*)::int AS total
    FROM users
    WHERE role = 'admin'
      AND status = 'active'
      AND deleted_at IS NULL
    `
  );

  return rows[0]?.total || 0;
}

export async function createUser({ email, passwordHash, fullName, role }, db = pool) {
  const { rows } = await query(db, 
    `
    INSERT INTO users (
      id,
      email,
      password_hash,
      full_name,
      role,
      status
    ) VALUES ($1, $2, $3, $4, $5, 'active')
    RETURNING ${SAFE_USER_FIELDS}
    `,
    [randomUUID(), email.toLowerCase(), passwordHash, fullName, role]
  );

  return rows[0];
}

export async function listUsers(db = pool) {
  const { rows } = await query(db, 
    `
    SELECT ${SAFE_USER_FIELDS}
    FROM users
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
    `
  );

  return rows;
}

export async function updateUserRoleById(userId, role, db = pool) {
  const { rows } = await query(db, 
    `
    UPDATE users
    SET
      role = $2,
      session_security_version = session_security_version + 1,
      updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING ${SAFE_USER_FIELDS}
    `,
    [userId, role]
  );

  return rows[0] || null;
}

export async function bumpSessionSecurityVersion(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    UPDATE users
    SET
      session_security_version = session_security_version + 1,
      updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING session_security_version
    `,
    [userId]
  );

  return rows[0]?.session_security_version ?? null;
}

export async function getSessionSecurityVersion(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT session_security_version
    FROM users
    WHERE id = $1
      AND deleted_at IS NULL
    LIMIT 1
    `,
    [userId]
  );

  return rows[0]?.session_security_version ?? 1;
}

export async function updateUserPasswordById(userId, passwordHash, db = pool) {
  const { rows } = await query(db, 
    `
    UPDATE users
    SET
      password_hash = $2,
      session_security_version = session_security_version + 1,
      updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING ${SAFE_USER_FIELDS}
    `,
    [userId, passwordHash]
  );

  return rows[0] || null;
}

export async function markUserEmailVerifiedById(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    UPDATE users
    SET
      email_verified_at = COALESCE(email_verified_at, NOW()),
      pending_email = NULL,
      pending_email_requested_at = NULL,
      session_security_version = session_security_version + 1,
      updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING ${SAFE_USER_FIELDS}
    `,
    [userId]
  );

  return rows[0] || null;
}

export async function setPendingEmailById(userId, pendingEmail, db = pool) {
  const { rows } = await query(
    db,
    `
    UPDATE users
    SET
      pending_email = $2,
      pending_email_requested_at = NOW(),
      email_verified_at = NULL,
      email_changed_at = NOW(),
      session_security_version = session_security_version + 1,
      updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING ${SAFE_USER_FIELDS}
    `,
    [userId, pendingEmail]
  );

  return rows[0] || null;
}

export async function promotePendingEmailById(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    UPDATE users
    SET
      email = pending_email,
      pending_email = NULL,
      pending_email_requested_at = NULL,
      email_verified_at = NOW(),
      email_changed_at = NOW(),
      session_security_version = session_security_version + 1,
      updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
      AND pending_email IS NOT NULL
    RETURNING ${SAFE_USER_FIELDS}
    `,
    [userId]
  );

  return rows[0] || null;
}

export async function clearPendingEmailById(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    UPDATE users
    SET
      pending_email = NULL,
      pending_email_requested_at = NULL,
      updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING ${SAFE_USER_FIELDS}
    `,
    [userId]
  );

  return rows[0] || null;
}

export async function findUserByNormalizedEmail(email, db = pool) {
  return findUserByEmail(email, db);
}

export async function softDeleteUserById(userId, db = pool) {
  const { rows } = await query(db, 
    `
    UPDATE users
    SET
      status = 'disabled',
      deleted_at = COALESCE(deleted_at, NOW()),
      updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING ${SAFE_USER_FIELDS}
    `,
    [userId]
  );

  return rows[0] || null;
}

export async function updateUserFullNameById(userId, fullName, db = pool) {
  const { rows } = await query(
    db,
    `
    UPDATE users
    SET full_name = $2, updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING ${SAFE_USER_FIELDS}
    `,
    [userId, fullName]
  );

  return rows[0] || null;
}

export async function setUserCcpaSaleOptOut({ userId, reason }, db = pool) {
  const { rows } = await query(
    db,
    `
    UPDATE users
    SET
      ccpa_sale_opt_out_at = COALESCE(ccpa_sale_opt_out_at, NOW()),
      ccpa_sale_opt_out_reason = COALESCE($2, ccpa_sale_opt_out_reason, 'CCPA opt-out request'),
      updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING ${SAFE_USER_FIELDS}
    `,
    [userId, reason ?? null]
  );

  return rows[0] || null;
}

export async function setUserProcessingRestriction(
  { userId, reason, restricted },
  db = pool
) {
  const { rows } = await query(
    db,
    `
    UPDATE users
    SET
      processing_restricted_at = CASE WHEN $2 THEN COALESCE(processing_restricted_at, NOW()) ELSE NULL END,
      processing_restriction_reason = CASE WHEN $2 THEN $3 ELSE NULL END,
      updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING ${SAFE_USER_FIELDS}
    `,
    [userId, restricted, reason ?? null]
  );

  return rows[0] || null;
}

export async function anonymizeUserById(userId, db = pool) {
  const email = `anonymized+${userId}@deleted.local`;
  const { rows } = await query(
    db,
    `
    UPDATE users
    SET
      email = $2,
      full_name = 'Deleted User',
      password_hash = '',
      status = 'disabled',
      deleted_at = COALESCE(deleted_at, NOW()),
      processing_restricted_at = COALESCE(processing_restricted_at, NOW()),
      processing_restriction_reason = COALESCE(
        processing_restriction_reason,
        'Account anonymized per DSAR request'
      ),
      updated_at = NOW()
    WHERE id = $1
    RETURNING id, email, full_name, role, status, deleted_at, created_at, updated_at
    `,
    [userId, email]
  );

  return rows[0] || null;
}

export async function grantUserMarketingConsent(
  { userId, marketingConsent, newsletterConsent, source },
  db = pool
) {
  const { rows } = await query(
    db,
    `
    UPDATE users
    SET
      marketing_consent = COALESCE($2, marketing_consent),
      newsletter_consent = COALESCE($3, newsletter_consent),
      marketing_consent_at = CASE
        WHEN COALESCE($2, marketing_consent) = TRUE OR COALESCE($3, newsletter_consent) = TRUE
        THEN COALESCE(marketing_consent_at, NOW())
        ELSE marketing_consent_at
      END,
      marketing_consent_source = COALESCE($4, marketing_consent_source),
      marketing_opt_out_at = NULL,
      marketing_opt_out_reason = NULL,
      updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING ${SAFE_USER_FIELDS}
    `,
    [userId, marketingConsent ?? null, newsletterConsent ?? null, source ?? null]
  );

  return rows[0] || null;
}

export async function withdrawUserMarketingConsent(
  { userId, scope, reason, source },
  db = pool
) {
  const withdrawMarketing =
    scope === "marketing" || scope === "all_non_transactional";
  const withdrawNewsletter =
    scope === "newsletter" || scope === "all_non_transactional";

  const { rows } = await query(
    db,
    `
    UPDATE users
    SET
      marketing_consent = CASE WHEN $2 THEN FALSE ELSE marketing_consent END,
      newsletter_consent = CASE WHEN $3 THEN FALSE ELSE newsletter_consent END,
      marketing_opt_out_at = NOW(),
      marketing_opt_out_reason = COALESCE($4, marketing_opt_out_reason, 'opt_out'),
      updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING ${SAFE_USER_FIELDS}
    `,
    [userId, withdrawMarketing, withdrawNewsletter, reason ?? source ?? null]
  );

  return rows[0] || null;
}

export async function findUserByIdIncludingDeleted(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT ${SAFE_USER_FIELDS}, deleted_at
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
}
