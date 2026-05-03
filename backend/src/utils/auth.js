import crypto from "crypto";
import { promisify } from "util";
import env from "../config/env.js";

const scryptAsync = promisify(crypto.scrypt);
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function sign(value) {
  return crypto
    .createHmac("sha256", env.AUTH_TOKEN_SECRET)
    .update(value)
    .digest("base64url");
}

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

export function createAuthToken(user) {
  const header = base64UrlEncode({ alg: "HS256", typ: "JWT" });
  const payload = base64UrlEncode({
    sub: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  });
  const unsigned = `${header}.${payload}`;

  return `${unsigned}.${sign(unsigned)}`;
}

export function verifyAuthToken(token) {
  try {
    const [header, payload, signature] = String(token || "").split(".");

    if (!header || !payload || !signature) {
      return null;
    }

    const unsigned = `${header}.${payload}`;
    const expected = sign(unsigned);
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return null;
    }

    const decoded = base64UrlDecode(payload);

    if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export function sanitizeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    status: user.status,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}
