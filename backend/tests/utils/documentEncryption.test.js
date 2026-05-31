import assert from "node:assert/strict";
import { randomBytes } from "crypto";
import { test } from "node:test";
import {
  decryptBuffer,
  encryptBuffer,
  packEncryptedPayload,
  parseEncryptionKeyBase64,
  unpackEncryptedPayload,
} from "../../src/utils/documentEncryption.js";

const TEST_KEY = randomBytes(32);

test("parseEncryptionKeyBase64 accepts a 32-byte key", () => {
  const base64 = TEST_KEY.toString("base64");
  const parsed = parseEncryptionKeyBase64(base64);
  assert.equal(parsed.length, 32);
});

test("parseEncryptionKeyBase64 rejects invalid key length", () => {
  assert.throws(
    () => parseEncryptionKeyBase64(Buffer.from("short").toString("base64")),
    /32 bytes/
  );
});

test("encrypt/decrypt round trip preserves plaintext", () => {
  const plaintext = Buffer.from("sensitive dsar export content");
  const encrypted = encryptBuffer(plaintext, TEST_KEY);
  const packed = packEncryptedPayload(encrypted);
  const decrypted = decryptBuffer(packed, TEST_KEY);

  assert.equal(decrypted.toString("utf8"), plaintext.toString("utf8"));
});

test("encrypt uses different IV for same content", () => {
  const plaintext = Buffer.from("repeatable content");
  const first = packEncryptedPayload(encryptBuffer(plaintext, TEST_KEY));
  const second = packEncryptedPayload(encryptBuffer(plaintext, TEST_KEY));

  assert.notEqual(first.toString("hex"), second.toString("hex"));
});

test("decrypt fails when ciphertext is tampered", () => {
  const packed = packEncryptedPayload(
    encryptBuffer(Buffer.from("protected"), TEST_KEY)
  );
  packed[packed.length - 1] ^= 0xff;

  assert.throws(() => decryptBuffer(packed, TEST_KEY));
});

test("unpackEncryptedPayload rejects short buffers", () => {
  assert.throws(() => unpackEncryptedPayload(Buffer.alloc(8)), /too short/);
});
