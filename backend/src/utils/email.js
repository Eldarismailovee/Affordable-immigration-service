import { createHash } from "node:crypto";

const CONTROL_CHARS = /[\x00-\x1f\x7f]/;
const MAX_EMAIL_LENGTH = 254;

export function normalizeEmail(email) {
  const trimmed = String(email || "").trim().toLowerCase();

  if (!trimmed || trimmed.length > MAX_EMAIL_LENGTH) {
    return "";
  }

  if (CONTROL_CHARS.test(trimmed)) {
    return "";
  }

  const atIndex = trimmed.lastIndexOf("@");

  if (atIndex <= 0 || atIndex === trimmed.length - 1) {
    return "";
  }

  return trimmed;
}

export function hashEmail(email) {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    return createHash("sha256").update(String(email || "")).digest("hex");
  }

  return createHash("sha256").update(normalized).digest("hex");
}

export function emailsEqual(left, right) {
  const a = normalizeEmail(left);
  const b = normalizeEmail(right);

  if (!a || !b) {
    return false;
  }

  return a === b;
}
