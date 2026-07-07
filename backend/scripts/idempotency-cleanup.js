import { cleanupExpiredIdempotencyRecords } from "../src/services/idempotency.service.js";
import { logger } from "../src/lib/logger.js";

async function main() {
  const limit = Number(process.env.IDEMPOTENCY_CLEANUP_BATCH_SIZE || 500);
  const deletedCount = await cleanupExpiredIdempotencyRecords({ limit });

  logger.info({ deletedCount, limit }, "Idempotency cleanup completed");
}

main().catch((error) => {
  logger.error({ err: error }, "Idempotency cleanup failed");
  process.exitCode = 1;
});
