/**
 * Validates internal relative return paths to prevent open redirects.
 */

const BLOCKED_PATTERNS = [/^\/\//, /^https?:/i, /^\/\\+/, /@/];

function hasControlCharacters(value) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 0x1f) {
      return true;
    }
  }
  return false;
}

export function sanitizeReturnPath(value) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || hasControlCharacters(trimmed)) {
    return null;
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return null;
    }
  }

  let decoded = trimmed;

  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    return null;
  }

  if (!decoded.startsWith("/") || decoded.startsWith("//") || hasControlCharacters(decoded)) {
    return null;
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(decoded)) {
      return null;
    }
  }

  return trimmed.split(/[?#]/)[0] || null;
}
