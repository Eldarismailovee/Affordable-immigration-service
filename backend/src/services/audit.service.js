import { randomUUID } from "crypto";
import { createAdminAuditLog } from "../repositories/audit.repository.js";

export async function recordAdminAction({ userId, method, path, status, requestId }) {
  await createAdminAuditLog({
    id: randomUUID(),
    userId,
    method,
    path,
    status,
    requestId,
  });
}
