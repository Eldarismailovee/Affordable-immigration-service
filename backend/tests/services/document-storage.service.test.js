import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "crypto";
import { mkdtemp, readFile, rm } from "fs/promises";
import os from "os";
import path from "path";
import { after, before, test } from "node:test";

const CONFIG_KEYS = ["NODE_ENV", "DOCUMENT_ENCRYPTION_KEY_BASE64", "AUTH_TOKEN_SECRET", "DATABASE_URL"];

function withEnv(overrides) {
  const previous = new Map();

  for (const key of CONFIG_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }

  process.env.NODE_ENV = "test";
  process.env.AUTH_TOKEN_SECRET = "x".repeat(32);
  process.env.DATABASE_URL = "postgresql://test:test@127.0.0.1:5432/test";

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  return () => {
    for (const key of CONFIG_KEYS) {
      const value = previous.get(key);

      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
}

async function importStorageModule() {
  return import(`../../src/services/document-storage.service.js?case=${randomUUID()}`);
}

let tempDir;

before(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "doc-storage-"));
});

after(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

test("writeSensitiveDocumentFile stores plaintext when encryption key is absent", async () => {
  const restore = withEnv({ DOCUMENT_ENCRYPTION_KEY_BASE64: undefined });

  try {
    const storage = await importStorageModule();

    const result = await storage.writeSensitiveDocumentFile({
      directory: tempDir,
      basename: "plain.pdf",
      buffer: Buffer.from("%PDF-plain"),
    });

    assert.equal(result.encrypted, false);
    assert.equal(result.filename, "plain.pdf");

    const onDisk = await readFile(result.absolutePath);
    assert.equal(onDisk.toString("utf8"), "%PDF-plain");
  } finally {
    restore();
  }
});

test("writeSensitiveDocumentFile encrypts on disk when key is configured", async () => {
  const key = randomBytes(32).toString("base64");
  const restore = withEnv({ DOCUMENT_ENCRYPTION_KEY_BASE64: key });

  try {
    const storage = await importStorageModule();

    const plaintext = Buffer.from("%PDF-encrypted");
    const result = await storage.writeSensitiveDocumentFile({
      directory: tempDir,
      basename: "secure.pdf",
      buffer: plaintext,
    });

    assert.equal(result.encrypted, true);
    assert.match(result.filename, /\.enc$/);

    const onDisk = await readFile(result.absolutePath);
    assert.notEqual(onDisk.toString("utf8"), plaintext.toString("utf8"));

    const decrypted = await storage.readSensitiveDocumentFile(result.absolutePath);
    assert.equal(decrypted.toString("utf8"), plaintext.toString("utf8"));
  } finally {
    restore();
  }
});

test("isDocumentEncryptionEnabled reflects env key presence", async () => {
  const restore = withEnv({ DOCUMENT_ENCRYPTION_KEY_BASE64: randomBytes(32).toString("base64") });

  try {
    const storage = await importStorageModule();

    assert.equal(storage.isDocumentEncryptionEnabled(), true);
  } finally {
    restore();
  }
});
