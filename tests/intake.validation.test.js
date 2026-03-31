import test from "node:test";
import assert from "node:assert/strict";
import { finalIntakeSchema } from "../src/schemas/intake.schema.js";

const validPayload = {
  selectedPackage: "filing",
  firstName: "Arina",
  lastName: "Demo",
  email: "arina@example.com",
  phone: "(555) 123-4567",
  caseType: "Marriage-based green card",
  notes: "Demo intake",
  additionalI130Count: 1,
  expedited: false,
  consultationType: "Zoom",
  preferredDateTime: "2026-04-03 10:00",
  billingName: "Arina Demo",
  billingEmail: "billing@example.com",
  paymentPreference: "invoice",
  consentManualProcessing: true,
  paymentNotes: "Send invoice after consultation",
};

test("final intake schema accepts a valid payload", () => {
  const result = finalIntakeSchema.safeParse(validPayload);
  assert.equal(result.success, true);
});

test("final intake schema rejects missing consent", () => {
  const result = finalIntakeSchema.safeParse({
    ...validPayload,
    consentManualProcessing: false,
  });

  assert.equal(result.success, false);
});

test("final intake schema rejects invalid payment preference", () => {
  const result = finalIntakeSchema.safeParse({
    ...validPayload,
    paymentPreference: "credit_card_form",
  });

  assert.equal(result.success, false);
});
