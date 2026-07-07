import { invalidHostedPaymentUrlError } from "../domain/errors.js";

const BLOCKED_PROTOCOLS = new Set(["javascript:", "data:", "file:", "vbscript:"]);
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function isPrivateOrLocalHost(hostname) {
  const normalized = String(hostname || "").trim().toLowerCase();

  if (LOCAL_HOSTNAMES.has(normalized)) {
    return true;
  }

  if (/^10\./.test(normalized)) return true;
  if (/^192\.168\./.test(normalized)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) return true;
  if (/^169\.254\./.test(normalized)) return true;
  if (normalized.endsWith(".local")) return true;

  return false;
}

export function parseHostedPaymentUrl(
  url,
  { allowedHosts = [], requireAllowlist = false } = {}
) {
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

  if (parsed.username || parsed.password) {
    throw invalidHostedPaymentUrlError("Hosted payment URL must not include credentials");
  }

  const hostname = parsed.hostname.toLowerCase();

  if (isPrivateOrLocalHost(hostname)) {
    throw invalidHostedPaymentUrlError("Hosted payment URL host is not allowed");
  }

  if (requireAllowlist || allowedHosts.length > 0) {
    if (allowedHosts.length === 0) {
      throw invalidHostedPaymentUrlError("Hosted payment URL host allowlist is not configured");
    }

    if (!allowedHosts.includes(hostname)) {
      throw invalidHostedPaymentUrlError("Hosted payment URL host is not allowed");
    }
  }

  return parsed.toString();
}
