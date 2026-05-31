import env from "../config/env.js";

export const EMAIL_MESSAGE_TYPES = {
  TRANSACTIONAL: "transactional",
  MARKETING: "marketing",
};

export const EMAIL_TEMPLATE_CATEGORIES = {
  ACCOUNT_SECURITY: "account_security",
  AUTHENTICATION: "authentication",
  SERVICE_NOTICE: "service_notice",
  LEGAL_NOTICE: "legal_notice",
  MARKETING: "marketing",
  NEWSLETTER: "newsletter",
};

export const EMAIL_SUPPRESSION_REASONS = {
  UNSUBSCRIBE: "unsubscribe",
  ADMIN_SUPPRESSED: "admin_suppressed",
  BOUNCE: "bounce",
  COMPLAINT: "complaint",
  CCPA_OPT_OUT: "ccpa_opt_out",
  CONSENT_WITHDRAWN: "consent_withdrawn",
  GPC: "gpc",
};

export const EMAIL_SUPPRESSION_SCOPES = {
  MARKETING: "marketing",
  NEWSLETTER: "newsletter",
  ALL_NON_TRANSACTIONAL: "all_non_transactional",
};

export const EMAIL_TEMPLATES = {
  PASSWORD_RESET: {
    key: "password_reset",
    messageType: EMAIL_MESSAGE_TYPES.TRANSACTIONAL,
    category: EMAIL_TEMPLATE_CATEGORIES.AUTHENTICATION,
  },
  EMAIL_VERIFICATION: {
    key: "email_verification",
    messageType: EMAIL_MESSAGE_TYPES.TRANSACTIONAL,
    category: EMAIL_TEMPLATE_CATEGORIES.AUTHENTICATION,
  },
  NEWSLETTER: {
    key: "newsletter",
    messageType: EMAIL_MESSAGE_TYPES.MARKETING,
    category: EMAIL_TEMPLATE_CATEGORIES.NEWSLETTER,
  },
  MARKETING_ANNOUNCEMENT: {
    key: "marketing_announcement",
    messageType: EMAIL_MESSAGE_TYPES.MARKETING,
    category: EMAIL_TEMPLATE_CATEGORIES.MARKETING,
  },
};

const PLACEHOLDER_PHYSICAL_ADDRESS = "TODO_INTERNAL_CONFIRM_BEFORE_LAUNCH";

function resolvePhysicalMailingAddress() {
  const fromEnv = (process.env.MARKETING_PHYSICAL_ADDRESS || "").trim();
  if (fromEnv && fromEnv !== PLACEHOLDER_PHYSICAL_ADDRESS) {
    return fromEnv;
  }
  return "";
}

function resolveSupportEmail() {
  const fromEnv = (process.env.MARKETING_SUPPORT_EMAIL || "").trim();
  if (fromEnv) {
    return fromEnv;
  }
  return "privacy@example.com";
}

export function getMarketingPhysicalAddress() {
  return resolvePhysicalMailingAddress();
}

export function isMarketingPhysicalAddressConfigured() {
  return Boolean(getMarketingPhysicalAddress());
}

export const EMAIL_COMPLIANCE = Object.freeze({
  physicalMailingAddress: resolvePhysicalMailingAddress(),
  supportEmail: resolveSupportEmail(),
  unsubscribeBaseUrl: `${env.CLIENT_URL.replace(/\/$/, "")}/unsubscribe`,
  senderName: "Affordable Immigration Service",
});

export function buildUnsubscribeUrl(token) {
  const base = EMAIL_COMPLIANCE.unsubscribeBaseUrl;
  return `${base}?token=${encodeURIComponent(token)}`;
}
