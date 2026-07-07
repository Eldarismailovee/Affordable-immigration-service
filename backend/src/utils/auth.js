import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { SignJWT, jwtVerify } from "jose";
import { securityConfig } from "../config/security.js";

const scryptAsync = promisify(scrypt);
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_DAYS = 30;
export const EMAIL_VERIFICATION_TOKEN_TTL_HOURS = 24;
export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 30;

const authSecret = new TextEncoder().encode(securityConfig.authTokenSecret);

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await scryptAsync(password, salt, 64);

  return `scrypt:${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password, passwordHash) {
  const [algorithm, salt, storedKey] = String(passwordHash || "").split(":");

  if (algorithm !== "scrypt" || !salt || !storedKey) {
    return false;
  }

  const key = await scryptAsync(password, salt, 64);
  const storedBuffer = Buffer.from(storedKey, "hex");

  if (storedBuffer.length !== key.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, key);
}

export async function createAccessToken(
  user,
  {
    sessionId,
    mfaCompleted = false,
    mfaCompletedAt = null,
    sessionSecurityVersion = 1,
  } = {}
) {
  const emailVerified = Boolean(user.emailVerifiedAt ?? user.email_verified_at);

  return new SignJWT({
    role: user.role,
    typ: "access",
    mfa: mfaCompleted,
    emailVerified,
    ...(mfaCompletedAt
      ? { mfaAt: Math.floor(new Date(mfaCompletedAt).getTime() / 1000) }
      : {}),
    secVer: sessionSecurityVersion,
    ...(sessionId ? { sid: sessionId } : {}),
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuedAt()
    .setJti(randomUUID())
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(authSecret);
}

export async function verifyAuthToken(token) {
  try {
    const { payload } = await jwtVerify(String(token || ""), authSecret, {
      algorithms: ["HS256"],
      typ: "JWT",
    });

    if (payload.typ !== "access" || !payload.sub) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function isMfaChallengeJwtPayload(payload) {
  return payload?.typ === "mfa_challenge";
}

export function createOpaqueToken() {
  return randomBytes(48).toString("base64url");
}

export function hashToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

export function addSeconds(date, seconds) {
  return new Date(date.getTime() + seconds * 1000);
}

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function sanitizeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name ?? user.fullName,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.email_verified_at ?? user.emailVerifiedAt ?? null,
    pendingEmail: user.pending_email ?? user.pendingEmail ?? null,
    pendingEmailRequestedAt:
      user.pending_email_requested_at ?? user.pendingEmailRequestedAt ?? null,
    emailChangedAt: user.email_changed_at ?? user.emailChangedAt ?? null,
    processingRestrictedAt:
      user.processing_restricted_at ?? user.processingRestrictedAt ?? null,
    processingRestrictionReason:
      user.processing_restriction_reason ?? user.processingRestrictionReason ?? null,
    marketingConsent: Boolean(user.marketing_consent ?? user.marketingConsent),
    newsletterConsent: Boolean(user.newsletter_consent ?? user.newsletterConsent),
    marketingConsentAt: user.marketing_consent_at ?? user.marketingConsentAt ?? null,
    marketingOptOutAt: user.marketing_opt_out_at ?? user.marketingOptOutAt ?? null,
    createdAt: user.created_at ?? user.createdAt,
    updatedAt: user.updated_at ?? user.updatedAt,
  };
}
