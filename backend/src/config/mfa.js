import env from "./env.js";
import {
  decryptMfaSecret,
  encryptMfaSecret,
  parseMfaEncryptionKeyBase64,
} from "../utils/mfaEncryption.js";

const DEFAULT_TEST_MFA_KEY_BASE64 = Buffer.alloc(32, 0x71).toString("base64");

function resolveMfaEncryptionKey() {
  const raw = env.MFA_ENCRYPTION_KEY || (env.isProduction ? "" : DEFAULT_TEST_MFA_KEY_BASE64);
  return parseMfaEncryptionKeyBase64(raw);
}

const encryptionKey = resolveMfaEncryptionKey();

export const mfaConfig = Object.freeze({
  issuer: env.MFA_ISSUER,
  challengeTtlSeconds: env.MFA_CHALLENGE_TTL_SECONDS,
  stepUpMaxAgeSeconds: env.MFA_STEP_UP_MAX_AGE_SECONDS,
  maxAttempts: env.MFA_MAX_ATTEMPTS,
  encryptionKey,
  encryptionKeyVersion: env.MFA_ENCRYPTION_KEY_VERSION,
  totpEpochTolerance: 30,
  totpPeriod: 30,
});

export function getMfaEncryptionKey() {
  if (!mfaConfig.encryptionKey) {
    throw new Error("MFA_ENCRYPTION_KEY is not configured");
  }

  return mfaConfig.encryptionKey;
}

export function encryptTotpSecret(plaintext) {
  return encryptMfaSecret(plaintext, getMfaEncryptionKey(), mfaConfig.encryptionKeyVersion);
}

export function decryptTotpSecret(encryptedSecret, encryptionNonce) {
  return decryptMfaSecret(encryptedSecret, encryptionNonce, getMfaEncryptionKey());
}

export default mfaConfig;
