const SENSITIVE_KEY_PATTERN =
  /(?:token|password|secret|recovery|email|phone|address|intake|dsar|payment|authorization|cookie)/i;

function redactValue(key, value) {
  if (SENSITIVE_KEY_PATTERN.test(String(key))) {
    return "[redacted]";
  }

  if (typeof value === "string" && value.length > 120) {
    return "[truncated]";
  }

  return value;
}

function sanitizeContext(context) {
  if (!context || typeof context !== "object") {
    return undefined;
  }

  const safe = {};

  for (const [key, value] of Object.entries(context)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      continue;
    }

    safe[key] = redactValue(key, value);
  }

  return safe;
}

export function logError(message, context) {
  const safeContext = sanitizeContext(context);

  if (safeContext && Object.keys(safeContext).length > 0) {
    console.error(message, safeContext);
    return;
  }

  console.error(message);
}

export function logDebug(message, context) {
  if (import.meta.env?.DEV !== true) {
    return;
  }

  const safeContext = sanitizeContext(context);

  if (safeContext && Object.keys(safeContext).length > 0) {
    console.debug(message, safeContext);
    return;
  }

  console.debug(message);
}
