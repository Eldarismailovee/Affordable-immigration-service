#!/usr/bin/env node
/**
 * Encrypt existing plaintext DSAR export PDFs on disk.
 * Requires DOCUMENT_ENCRYPTION_KEY_BASE64. Backs up nothing — run backup first.
 *
 * Usage:
 *   node src/scripts/encrypt-existing-documents.js --dry-run
 *   node src/scripts/encrypt-existing-documents.js
 */
import { readdir, readFile, rename, unlink, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getDocumentEncryptionKey, isDocumentEncryptionConfigured } from "../config/documentEncryption.js";
import { encryptBuffer, packEncryptedPayload } from "../utils/documentEncryption.js";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DSAR_EXPORT_DIR = path.join(ROOT_DIR, "var", "dsar-exports");
const dryRun = process.argv.includes("--dry-run");

async function main() {
  if (!isDocumentEncryptionConfigured()) {
    console.error("DOCUMENT_ENCRYPTION_KEY_BASE64 is required");
    process.exit(1);
  }

  let entries;
  try {
    entries = await readdir(DSAR_EXPORT_DIR);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("No dsar-exports directory; nothing to do.");
      return;
    }
    throw error;
  }

  const plaintextPdfs = entries.filter(
    (name) => name.endsWith(".pdf") && !name.endsWith(".pdf.enc")
  );

  if (plaintextPdfs.length === 0) {
    console.log("No plaintext PDF files found.");
    return;
  }

  for (const name of plaintextPdfs) {
    const sourcePath = path.join(DSAR_EXPORT_DIR, name);
    const encName = `${name}.enc`;
    const targetPath = path.join(DSAR_EXPORT_DIR, encName);

    console.log(`${dryRun ? "[dry-run] " : ""}Encrypt ${name} -> ${encName}`);

    if (dryRun) {
      continue;
    }

    const plaintext = await readFile(sourcePath);
    const packed = packEncryptedPayload(
      encryptBuffer(plaintext, getDocumentEncryptionKey())
    );
    const tempPath = `${targetPath}.tmp`;

    await writeFile(tempPath, packed);
    await rename(tempPath, targetPath);
    await unlink(sourcePath);
  }

  console.log(`Done. Processed ${plaintextPdfs.length} file(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
