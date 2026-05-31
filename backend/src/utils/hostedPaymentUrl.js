import { invalidHostedPaymentUrlError } from "../domain/errors.js";

const BLOCKED_PROTOCOLS = new Set(["javascript:", "data:", "file:", "vbscript:"]);

export function parseHostedPaymentUrl(url, { allowedHosts = [] } = {}) {
  if (typeof url !== "string" || url.trim().length === 0) {
    throw invalidHostedPaymentUrlError("Hosted payment URL is required");
  }

  let parsed;

  try {
    parsed = new URL(url.trim());
  } catch {
    throw invalidHostedPaymentUrlError("Hosted payment URL must be a valid URL");
  }

  const protocol = parsed.protocol.toLowerCase();

  if (BLOCKED_PROTOCOLS.has(protocol)) {
    throw invalidHostedPaymentUrlError("Hosted payment URL uses a blocked protocol");
  }

  if (protocol !== "https:") {
    throw invalidHostedPaymentUrlError("Hosted payment URL must use HTTPS");
  }

  if (allowedHosts.length > 0 && !allowedHosts.includes(parsed.hostname)) {
    throw invalidHostedPaymentUrlError("Hosted payment URL host is not allowed");
  }

  return parsed.toString();
}
