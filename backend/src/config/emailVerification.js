import env from "./env.js";

const emailVerificationConfig = Object.freeze({
  tokenTtlSeconds: env.EMAIL_VERIFICATION_TOKEN_TTL_SECONDS,
  resendCooldownSeconds: env.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS,
  maxSendsPerHour: env.EMAIL_VERIFICATION_MAX_SENDS_PER_HOUR,
  maxVerifyAttempts: env.EMAIL_VERIFICATION_MAX_VERIFY_ATTEMPTS,
  publicUrl: env.APP_PUBLIC_URL,
});

export default emailVerificationConfig;
