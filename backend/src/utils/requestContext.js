import { createHash } from "crypto";

function hashIp(ipAddress) {
  if (!ipAddress) {
    return null;
  }

  return createHash("sha256").update(String(ipAddress)).digest("hex");
}

export function getRequestContext(req) {
  const ipAddress = req.ip || "";

  return {
    userAgent: req.get("user-agent") || "",
    ipAddress,
    requestId: req.id,
    ipHash: hashIp(ipAddress),
  };
}
