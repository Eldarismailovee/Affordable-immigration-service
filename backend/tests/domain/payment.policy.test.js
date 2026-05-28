import test from "node:test";
import assert from "node:assert/strict";
import {
  assertCanUpdatePaymentStatus,
  parsePaymentStatus,
} from "../../src/domain/payment.policy.js";

test("payment status updates are admin-only", () => {
  assert.doesNotThrow(() => assertCanUpdatePaymentStatus({ id: "admin-1", role: "admin" }));

  assert.throws(() => assertCanUpdatePaymentStatus({ id: "user-1", role: "user" }), {
    name: "AppError",
    statusCode: 403,
    code: "INSUFFICIENT_PERMISSIONS",
  });
});

test("parsePaymentStatus accepts only domain payment statuses", () => {
  assert.equal(parsePaymentStatus("paid"), "paid");
  assert.equal(parsePaymentStatus("pending_manual_processing"), "pending_manual_processing");

  assert.throws(() => parsePaymentStatus("refunded"), {
    name: "AppError",
    statusCode: 400,
    code: "INVALID_PAYMENT_STATUS",
  });
});
