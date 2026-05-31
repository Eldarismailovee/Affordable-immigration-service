import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  getDocumentEncryptionKey,
  isDocumentEncryptionConfigured,
} from "../config/documentEncryption.js";
import {
  decryptBuffer,
  encryptBuffer,
  isEncryptedFilePath,
  packEncryptedPayload,
} from "../utils/documentEncryption.js";

export function isDocumentEncryptionEnabled() {
  return isDocumentEncryptionConfigured();
}

export async function writeSensitiveDocumentFile({ directory, basename, buffer }) {
  await mkdir(directory, { recursive: true });

  if (isDocumentEncryptionEnabled()) {
    const key = getDocumentEncryptionKey();
    const encrypted = encryptBuffer(buffer, key);
    const packed = packEncryptedPayload(encrypted);
    const filename = `${basename}.enc`;
    const absolutePath = path.join(directory, filename);

    await writeFile(absolutePath, packed);

    return {
      absolutePath,
      filename,
      encrypted: true,
      keyId: encrypted.keyId,
    };
  }

  const filename = basename;
  const absolutePath = path.join(directory, filename);

  await writeFile(absolutePath, buffer);

  return {
    absolutePath,
    filename,
    encrypted: false,
    keyId: null,
  };
}

export async function readSensitiveDocumentFile(absolutePath) {
  const buffer = await readFile(absolutePath);

  if (!isEncryptedFilePath(absolutePath)) {
    return buffer;
  }

  if (!isDocumentEncryptionConfigured()) {
    throw new Error("Encrypted document cannot be read without DOCUMENT_ENCRYPTION_KEY_BASE64");
  }

  return decryptBuffer(buffer, getDocumentEncryptionKey());
}
