import { runDsarDeletionWorkflow } from "./dsar-deletion.service.js";

export async function anonymizeUserRecord(userId, { requestId } = {}) {
  const result = await runDsarDeletionWorkflow({
    userId,
    requestId: requestId ?? userId,
  });

  return {
    user: result.user,
    verification: result.verification,
    fileFailures: result.fileFailures,
  };
}
