import env from "../config/env.js";
import { logger } from "../lib/logger.js";

function getErrorCode(err, statusCode) {
  if (typeof err.code === "string" && err.code.length > 0) {
    return err.code;
  }

  if (statusCode === 400) return "BAD_REQUEST";
  if (statusCode === 401) return "AUTHENTICATION_REQUIRED";
  if (statusCode === 403) return "INSUFFICIENT_PERMISSIONS";
  if (statusCode === 404) return "NOT_FOUND";
  if (statusCode === 409) return "CONFLICT";
  return "INTERNAL_SERVER_ERROR";
}

export function errorHandler(err, req, res, _next) {
  const isUploadError = err.name === "MulterError";
  const statusCode =
    err.statusCode ||
    (isUploadError ? 400 : null) ||
    (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  const log = req.log || logger;
  log.error(
    {
      err: { message: err.message, name: err.name, stack: err.stack },
      statusCode,
      requestId: req.id,
    },
    "Request error"
  );

  const traceId = req.requestId || req.id;
  const code = getErrorCode(err, statusCode);
  const exposeMessage = statusCode < 500 || !env.isProduction;
  const message = exposeMessage ? err.message || "Server error" : "Server error";

  const payload = {
    success: false,
    message,
    code,
    traceId,
    requestId: traceId,
  };

  if (Array.isArray(err.details) && err.details.length > 0) {
    payload.errors = err.details;
  }

  res.status(statusCode).json(payload);
}
