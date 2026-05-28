import { closeDatabasePool } from "../db/shutdown.js";
import { logger } from "../lib/logger.js";

export function registerGracefulShutdown(server, { timeoutMs = 10000 } = {}) {
  let isShuttingDown = false;

  const shutdown = (signal) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    logger.info({ signal }, "Graceful shutdown started");

    const forceExitTimer = setTimeout(() => {
      logger.error({ signal, timeoutMs }, "Graceful shutdown timed out");
      process.exit(1);
    }, timeoutMs);
    forceExitTimer.unref();

    server.close(async (error) => {
      if (error) {
        logger.error({ err: error, signal }, "HTTP server failed to close cleanly");
      }

      try {
        await closeDatabasePool();
        logger.info({ signal }, "Graceful shutdown completed");
        process.exit(error ? 1 : 0);
      } catch (dbError) {
        logger.error({ err: dbError, signal }, "Database pool failed to close cleanly");
        process.exit(1);
      }
    });

    server.closeIdleConnections?.();
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
