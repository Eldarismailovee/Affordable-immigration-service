import { SignJWT, jwtVerify } from "jose";
import { securityConfig } from "../config/security.js";
import { normalizeEmail } from "./email.js";

const unsubscribeSecret = new TextEncoder().encode(securityConfig.authTokenSecret);
const UNSUBSCRIBE_TOKEN_TTL = "365d";

export async function createUnsubscribeToken({ email, scope }) {
  return new SignJWT({
    typ: "unsubscribe",
    scope,
    email: normalizeEmail(email),
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(UNSUBSCRIBE_TOKEN_TTL)
    .sign(unsubscribeSecret);
}

export async function verifyUnsubscribeToken(token) {
  try {
    const { payload } = await jwtVerify(String(token || ""), unsubscribeSecret, {
      algorithms: ["HS256"],
    });

    if (payload.typ !== "unsubscribe" || !payload.email || !payload.scope) {
      return null;
    }

    return {
      email: normalizeEmail(payload.email),
      scope: String(payload.scope),
    };
  } catch {
    return null;
  }
}
