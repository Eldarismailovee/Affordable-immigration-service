import { recordAdminAction } from "../services/audit.service.js";
import { logger } from "../lib/logger.js";

const AUDITED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function auditAdminAction(req, res, next) {
  if (!AUDITED_METHODS.has(req.method)) {
    return next();
  }

  res.on("finish", () => {
    recordAdminAction({
      userId: req.user?.id || null,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      requestId: req.id,
    }).catch((err) => {
      logger.error(
        { err, requestId: req.id, path: req.originalUrl },
        "Failed to write admin audit log"
      );
    });
  });

  next();
}
