import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export function parseMfaEncryptionKeyBase64(base64Key) {
  if (!base64Key) {
    return null;
  }

  const key = Buffer.from(base64Key, "base64");

  if (key.length !== 32) {
    throw new Error("MFA_ENCRYPTION_KEY must decode to 32 bytes");
  }

  return key;
}

export function encryptMfaSecret(plaintext, key, keyVersion) {
  const nonce = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, nonce);
  const ciphertext = Buffer.concat([
    cipher.update(String(plaintext), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    encryptedSecret: Buffer.concat([ciphertext, tag]),
    encryptionNonce: nonce,
    keyVersion,
  };
}

export function decryptMfaSecret(encryptedSecret, encryptionNonce, key) {
  if (encryptedSecret.length < AUTH_TAG_LENGTH + 1) {
    throw new Error("Encrypted MFA secret is too short");
  }

  const tagStart = encryptedSecret.length - AUTH_TAG_LENGTH;
  const ciphertext = encryptedSecret.subarray(0, tagStart);
  const tag = encryptedSecret.subarray(tagStart);
  const decipher = createDecipheriv(ALGORITHM, key, encryptionNonce);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
