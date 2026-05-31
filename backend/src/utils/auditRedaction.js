const SENSITIVE_KEY_PATTERN =
  /^(password|passwordHash|token|accessToken|refreshToken|tokenHash|authorization|cookie|cardNumber|pan|cvv|cvc|secret|apiKey|htmlContent|html_content|exportPayload|export_payload|notes|userMessage|requestedChanges|requested_changes)$/i;

const SENSITIVE_SUBSTRING_PATTERN =
  /(password|token|authorization|cookie|card|pan|cvv|secret|api[_-]?key)/i;

const MAX_METADATA_DEPTH = 4;

function isSensitiveKey(key) {
  if (typeof key !== "string") {
    return true;
  }

  return (
    SENSITIVE_KEY_PATTERN.test(key) || SENSITIVE_SUBSTRING_PATTERN.test(key)
  );
}

function sanitizeValue(value, depth) {
  if (depth > MAX_METADATA_DEPTH) {
    return "[truncated]";
  }

  if (value == null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  const sanitized = {};

  for (const [key, nested] of Object.entries(value)) {
    if (isSensitiveKey(key)) {
      continue;
    }

    sanitized[key] = sanitizeValue(nested, depth + 1);
  }

  return sanitized;
}

export function sanitizeAuditMetadata(metadata = {}) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return sanitizeValue(metadata, 0);
}

export function emailDomainOnly(email) {
  if (!email || typeof email !== "string") {
    return null;
  }

  const parts = email.toLowerCase().trim().split("@");
  return parts.length === 2 ? parts[1] : null;
}

export function intakeSubmitMetadata(payload) {
  return sanitizeAuditMetadata({
    selectedPackage: payload?.selectedPackage,
    caseType: payload?.caseType,
    hasPaymentNotes: Boolean(payload?.paymentNotes?.trim?.()),
    fieldNames: payload ? Object.keys(payload).sort() : [],
  });
}
