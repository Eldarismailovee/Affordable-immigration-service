import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertSafeUploadFilename,
  buildSafeImageFilename,
  detectImageMimeType,
  resolveUploadPath,
} from "../../src/services/upload-storage.service.js";

test("detectImageMimeType recognizes supported image magic bytes", () => {
  assert.equal(
    detectImageMimeType(Buffer.from([0xff, 0xd8, 0xff, 0xe0])),
    "image/jpeg"
  );
  assert.equal(
    detectImageMimeType(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    ),
    "image/png"
  );
  assert.equal(
    detectImageMimeType(Buffer.from("RIFFxxxxWEBP", "ascii")),
    "image/webp"
  );
  assert.equal(detectImageMimeType(Buffer.from("GIF89a", "ascii")), "image/gif");
});

test("detectImageMimeType rejects non-image content", () => {
  assert.equal(detectImageMimeType(Buffer.from("<script>alert(1)</script>")), null);
});

test("buildSafeImageFilename uses random server-side names and MIME-derived extensions", () => {
  const filename = buildSafeImageFilename({
    mimetype: "image/png",
    originalname: "../../logo.php",
  });

  assert.match(
    filename,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/
  );
});

test("assertSafeUploadFilename blocks path traversal and unsupported extensions", () => {
  assert.equal(assertSafeUploadFilename("logo.png"), "logo.png");
  assert.throws(() => assertSafeUploadFilename("../logo.png"), {
    code: "UPLOAD_NOT_FOUND",
    statusCode: 404,
  });
  assert.throws(() => assertSafeUploadFilename("payload.svg"), {
    code: "UPLOAD_NOT_FOUND",
    statusCode: 404,
  });
});

test("resolveUploadPath keeps resolved files inside the upload directory", () => {
  const resolvedPath = resolveUploadPath("logo.webp");
  assert.match(resolvedPath, /uploads\/logo\.webp$/);
});
