import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
export const DEFAULT_ENCRYPTION_KEY_ID = "v1";

export function parseEncryptionKeyBase64(base64Key) {
  if (!base64Key) {
    return null;
  }

  const key = Buffer.from(base64Key, "base64");

  if (key.length !== 32) {
    throw new Error("DOCUMENT_ENCRYPTION_KEY_BASE64 must decode to 32 bytes");
  }

  return key;
}

export function encryptBuffer(plaintext, key, keyId = DEFAULT_ENCRYPTION_KEY_ID) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv,
    tag,
    ciphertext,
    keyId,
  };
}

export function packEncryptedPayload({ iv, tag, ciphertext }) {
  return Buffer.concat([iv, tag, ciphertext]);
}

export function unpackEncryptedPayload(packed) {
  if (packed.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error("Encrypted payload is too short");
  }

  return {
    iv: packed.subarray(0, IV_LENGTH),
    tag: packed.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH),
    ciphertext: packed.subarray(IV_LENGTH + AUTH_TAG_LENGTH),
  };
}

export function decryptBuffer(packed, key) {
  const { iv, tag, ciphertext } = unpackEncryptedPayload(packed);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function isEncryptedFilePath(filePath) {
  return typeof filePath === "string" && filePath.endsWith(".enc");
}
