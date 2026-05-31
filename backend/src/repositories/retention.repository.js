import pool from "../db/pool.js";
import { query } from "../db/query.js";

export async function deleteAuditEventsOlderThan(cutoff, db = pool) {
  const { rowCount } = await query(
    db,
    `DELETE FROM audit_events WHERE created_at < $1`,
    [cutoff],
    { name: "retention.delete_audit_events" }
  );
  return rowCount ?? 0;
}

export async function deleteAdminAuditLogsOlderThan(cutoff, db = pool) {
  const { rowCount } = await query(
    db,
    `DELETE FROM admin_audit_log WHERE created_at < $1`,
    [cutoff],
    { name: "retention.delete_admin_audit_log" }
  );
  return rowCount ?? 0;
}

export async function deleteCookieConsentLogsOlderThan(cutoff, db = pool) {
  const { rowCount } = await query(
    db,
    `DELETE FROM cookie_consent_logs WHERE created_at < $1`,
    [cutoff],
    { name: "retention.delete_cookie_consent_logs" }
  );
  return rowCount ?? 0;
}

export async function deleteExpiredAuthRefreshTokens(db = pool) {
  const { rowCount } = await query(
    db,
    `DELETE FROM auth_refresh_tokens WHERE expires_at < NOW()`,
    [],
    { name: "retention.delete_expired_refresh_tokens" }
  );
  return rowCount ?? 0;
}
