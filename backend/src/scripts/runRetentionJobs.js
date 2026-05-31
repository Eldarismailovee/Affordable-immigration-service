import { parseRetentionCliArgs, runRetentionJobs } from "../services/retention.service.js";
import { logger } from "../lib/logger.js";

const options = parseRetentionCliArgs();

try {
  const summary = await runRetentionJobs({
    categories: options.categories ?? undefined,
    limit: options.limit,
    dryRun: options.dryRun,
    reason: options.reason,
  });

  logger.info(
    {
      dryRun: summary.dryRun,
      results: summary.results,
    },
    "Retention jobs finished"
  );
} catch (error) {
  logger.error({ err: error }, "Retention jobs failed");
  process.exitCode = 1;
}
