import test from "node:test";
import assert from "node:assert/strict";
import {
  docketwiseStubSchema,
  updatePaymentStatusSchema,
  updateUserRoleSchema,
} from "../../src/schemas/admin.schema.js";

test("updateUserRoleSchema accepts admin, user, and attorney roles", () => {
  assert.equal(updateUserRoleSchema.safeParse({ role: "admin" }).success, true);
  assert.equal(updateUserRoleSchema.safeParse({ role: "user" }).success, true);
  assert.equal(updateUserRoleSchema.safeParse({ role: "attorney" }).success, true);
});

test("updateUserRoleSchema rejects unknown roles", () => {
  assert.equal(updateUserRoleSchema.safeParse({ role: "superadmin" }).success, false);
});

test("updateUserRoleSchema rejects extra fields (strict)", () => {
  const result = updateUserRoleSchema.safeParse({ role: "admin", extra: "x" });
  assert.equal(result.success, false);
});

test("updatePaymentStatusSchema accepts a known payment status", () => {
  const result = updatePaymentStatusSchema.safeParse({ status: "paid" });
  assert.equal(result.success, true);
});

test("updatePaymentStatusSchema rejects an unknown status", () => {
  const result = updatePaymentStatusSchema.safeParse({ status: "weird" });
  assert.equal(result.success, false);
});

test("updatePaymentStatusSchema rejects extra fields (strict)", () => {
  const result = updatePaymentStatusSchema.safeParse({ status: "paid", note: "x" });
  assert.equal(result.success, false);
});

test("docketwiseStubSchema accepts arbitrary fields (passthrough)", () => {
  const result = docketwiseStubSchema.safeParse({
    email: "user@example.com",
    extra: "ok",
  });
  assert.equal(result.success, true);
  assert.equal(result.data.extra, "ok");
});

test("docketwiseStubSchema rejects an invalid email when provided", () => {
  const result = docketwiseStubSchema.safeParse({ email: "bad" });
  assert.equal(result.success, false);
});
