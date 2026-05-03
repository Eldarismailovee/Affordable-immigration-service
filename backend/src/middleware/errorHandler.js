import env from "../config/env.js";
import { logger } from "../lib/logger.js";

export function errorHandler(err, req, res, _next) {
  const statusCode =
    err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  const log = req.log || logger;
  log.error(
    {
      err: { message: err.message, name: err.name, stack: err.stack },
      statusCode,
      requestId: req.id,
    },
    "Request error"
  );

  const exposeMessage = statusCode < 500 || !env.isProduction;
  const message = exposeMessage ? err.message || "Server error" : "Server error";

  res.status(statusCode).json({
    message,
    requestId: req.id,
  });
}
