export function getRequestContext(req) {
  return {
    userAgent: req.get("user-agent") || "",
    ipAddress: req.ip || "",
  };
}
