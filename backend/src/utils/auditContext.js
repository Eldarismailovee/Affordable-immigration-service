import { createHash } from "crypto";
import { getRequestContext } from "./requestContext.js";

function hashValue(value) {
  if (!value) {
    return null;
  }

  return createHash("sha256").update(String(value)).digest("hex");
}

export function getAuditContext(req) {
  const { userAgent, ipAddress } = getRequestContext(req);

  return {
    requestId: req.id,
    userAgent,
    ipHash: hashValue(ipAddress),
  };
}

export function buildActor(actor) {
  return {
    actorUserId: actor?.id ?? null,
    actorRole: actor?.role ?? null,
  };
}
