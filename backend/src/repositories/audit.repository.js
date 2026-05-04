import pool from "../db/pool.js";
import { query } from "../db/query.js";

export async function createAdminAuditLog(
  { id, userId, method, path, status, requestId },
  db = pool
) {
  await query(db, 
    `
    INSERT INTO admin_audit_log (
      id, user_id, method, path, status, request_id
    ) VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [id, userId, method, path, status, requestId]
  );
}
