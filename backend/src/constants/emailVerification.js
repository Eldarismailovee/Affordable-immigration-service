export const EMAIL_VERIFICATION_PURPOSE = {
  REGISTRATION: "registration",
  RESEND: "resend",
  EMAIL_CHANGE: "email_change",
};

export const EMAIL_VERIFICATION_ERROR_CODES = {
  EMAIL_VERIFICATION_REQUIRED: "email_verification_required",
  EMAIL_ALREADY_VERIFIED: "email_already_verified",
  EMAIL_CHANGE_PENDING: "email_change_pending",
  EMAIL_IN_USE: "email_in_use",
  INVALID_VERIFICATION_TOKEN: "invalid_verification_token",
  VERIFICATION_RATE_LIMITED: "verification_rate_limited",
};

export const EMAIL_VERIFICATION_DELIVERY_STATUS = {
  NOT_CONFIGURED: "not_configured",
  ACCEPTED: "accepted",
  DELIVERED: "delivered",
  FAILED: "failed",
};

export const NEUTRAL_RESEND_MESSAGE =
  "If an account exists and requires verification, further instructions will be sent.";

export function isEmailVerified(user) {
  return Boolean(user?.email_verified_at ?? user?.emailVerifiedAt);
}
