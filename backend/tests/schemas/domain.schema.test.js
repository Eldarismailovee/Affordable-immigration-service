import test from "node:test";
import assert from "node:assert/strict";
import {
  imageUploadFileSchema,
  leadIdParamsSchema,
  userIdParamsSchema,
  uuidSchema,
} from "../../src/schemas/domain.schema.js";
import { MAX_IMAGE_UPLOAD_BYTES } from "../../src/constants/domain.js";

const SAMPLE_UUID = "550e8400-e29b-41d4-a716-446655440000";

test("uuidSchema accepts a valid UUID", () => {
  assert.equal(uuidSchema.safeParse(SAMPLE_UUID).success, true);
});

test("uuidSchema rejects a non-UUID", () => {
  assert.equal(uuidSchema.safeParse("not-a-uuid").success, false);
});

test("leadIdParamsSchema requires a UUID leadId", () => {
  assert.equal(leadIdParamsSchema.safeParse({ leadId: SAMPLE_UUID }).success, true);
  assert.equal(leadIdParamsSchema.safeParse({ leadId: "abc" }).success, false);
  assert.equal(leadIdParamsSchema.safeParse({}).success, false);
});

test("userIdParamsSchema requires a UUID userId", () => {
  assert.equal(userIdParamsSchema.safeParse({ userId: SAMPLE_UUID }).success, true);
  assert.equal(userIdParamsSchema.safeParse({ userId: "abc" }).success, false);
});

const validUpload = {
  fieldname: "image",
  originalname: "photo.png",
  mimetype: "image/png",
  size: 1024,
  filename: "stored.png",
  path: "/tmp/stored.png",
};

test("imageUploadFileSchema accepts a valid file", () => {
  assert.equal(imageUploadFileSchema.safeParse(validUpload).success, true);
});

test("imageUploadFileSchema rejects wrong fieldname", () => {
  const result = imageUploadFileSchema.safeParse({ ...validUpload, fieldname: "other" });
  assert.equal(result.success, false);
});

test("imageUploadFileSchema rejects unsupported mime type", () => {
  const result = imageUploadFileSchema.safeParse({
    ...validUpload,
    mimetype: "application/pdf",
  });
  assert.equal(result.success, false);
});

test("imageUploadFileSchema rejects files exceeding the size limit", () => {
  const result = imageUploadFileSchema.safeParse({
    ...validUpload,
    size: MAX_IMAGE_UPLOAD_BYTES + 1,
  });
  assert.equal(result.success, false);
});

test("imageUploadFileSchema rejects zero-byte uploads", () => {
  const result = imageUploadFileSchema.safeParse({ ...validUpload, size: 0 });
  assert.equal(result.success, false);
});
