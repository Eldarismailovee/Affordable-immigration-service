/** Sets Cache-Control: no-store for sensitive API responses. */

const SENSITIVE_PREFIXES = ["/api/auth", "/api/account", "/api/admin"];
const SENSITIVE_EXACT = new Set(["/api/public/privacy/request"]);

export function noStoreSensitiveResponses(req, res, next) {
  const path = req.originalUrl.split("?")[0];
  const isSensitive =
    SENSITIVE_PREFIXES.some((prefix) => path.startsWith(prefix)) ||
    SENSITIVE_EXACT.has(path);

  if (isSensitive) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
  }

  next();
}
