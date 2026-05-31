import test from "node:test";
import assert from "node:assert/strict";
import {
  emailDomainOnly,
  intakeSubmitMetadata,
  sanitizeAuditMetadata,
} from "../../src/utils/auditRedaction.js";

test("sanitizeAuditMetadata removes password, token, and card-like keys", () => {
  const sanitized = sanitizeAuditMetadata({
    oldStatus: "pending",
    password: "secret",
    accessToken: "tok",
    cardNumber: "4111111111111111",
    nested: {
      refreshToken: "rt",
      kept: "value",
    },
  });

  assert.equal(sanitized.oldStatus, "pending");
  assert.equal(sanitized.password, undefined);
  assert.equal(sanitized.accessToken, undefined);
  assert.equal(sanitized.cardNumber, undefined);
  assert.equal(sanitized.nested.kept, "value");
  assert.equal(sanitized.nested.refreshToken, undefined);
});

test("intakeSubmitMetadata keeps field names without sensitive values", () => {
  const metadata = intakeSubmitMetadata({
    firstName: "Jane",
    email: "jane@example.com",
    selectedPackage: "marriage",
    caseType: "I-130",
    paymentNotes: "call me",
  });

  assert.equal(metadata.selectedPackage, "marriage");
  assert.equal(metadata.hasPaymentNotes, true);
  assert.ok(metadata.fieldNames.includes("firstName"));
  assert.equal(metadata.firstName, undefined);
  assert.equal(metadata.email, undefined);
});

test("emailDomainOnly returns domain without local part", () => {
  assert.equal(emailDomainOnly("User@Example.COM"), "example.com");
  assert.equal(emailDomainOnly("invalid"), null);
});
