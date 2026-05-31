import { createHash } from "node:crypto";

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function hashEmail(email) {
  return createHash("sha256").update(normalizeEmail(email)).digest("hex");
}
