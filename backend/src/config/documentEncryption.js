import { parseEncryptionKeyBase64 } from "../utils/documentEncryption.js";

export function isDocumentEncryptionConfigured() {
  return Boolean(process.env.DOCUMENT_ENCRYPTION_KEY_BASE64?.trim());
}

export function getDocumentEncryptionKey() {
  const raw = process.env.DOCUMENT_ENCRYPTION_KEY_BASE64?.trim();

  if (!raw) {
    return null;
  }

  return parseEncryptionKeyBase64(raw);
}
