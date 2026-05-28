import crypto from "crypto";
import { promisify } from "util";
import { SignJWT, jwtVerify } from "jose";
import { securityConfig } from "../config/security.js";

const scryptAsync = promisify(crypto.scrypt);
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_DAYS = 30;
export const EMAIL_VERIFICATION_TOKEN_TTL_HOURS = 24;
export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 30;

const authSecret = new TextEncoder().encode(securityConfig.authTokenSecret);

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
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

  return crypto.timingSafeEqual(storedBuffer, key);
}

export async function createAccessToken(user, { sessionId } = {}) {
  return new SignJWT({
    role: user.role,
    typ: "access",
    ...(sessionId ? { sid: sessionId } : {}),
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuedAt()
    .setJti(crypto.randomUUID())
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

export function createOpaqueToken() {
  return crypto.randomBytes(48).toString("base64url");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
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
    fullName: user.full_name,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.email_verified_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}
