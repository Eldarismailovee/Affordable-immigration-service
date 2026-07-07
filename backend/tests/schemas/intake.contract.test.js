import test from "node:test";
import assert from "node:assert/strict";
import { finalIntakeSchema } from "../../src/schemas/intake.schema.js";

const validPayload = {
  selectedPackage: "filing",
  additionalI130Count: 0,
  expedited: false,
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phone: "+15551234567",
  caseType: "Marriage-based green cards",
  notes: "Need help",
  petitionRelationship: "Spouse / fiancé(e)",
  location: "California, USA",
  hasUrgentDeadline: false,
  urgentDeadlineNotes: "",
  consultationType: "Zoom",
  preferredDateTime: "2026-08-01T10:00:00",
  billingName: "Ada Lovelace",
  billingEmail: "billing@example.com",
  paymentPreference: "invoice",
  consentManualProcessing: true,
  consentAvailabilityAcknowledgment: true,
  paymentNotes: "",
};

test("finalIntakeSchema accepts case-review fields", () => {
  const result = finalIntakeSchema.safeParse(validPayload);
  assert.equal(result.success, true);
});

test("finalIntakeSchema rejects unknown fields", () => {
  const result = finalIntakeSchema.safeParse({
    ...validPayload,
    jurisdiction: "hidden",
  });
  assert.equal(result.success, false);
});

test("finalIntakeSchema requires urgent deadline notes when flagged", () => {
  const result = finalIntakeSchema.safeParse({
    ...validPayload,
    hasUrgentDeadline: true,
    urgentDeadlineNotes: "",
  });
  assert.equal(result.success, false);
});

test("finalIntakeSchema rejects invalid location", () => {
  const result = finalIntakeSchema.safeParse({
    ...validPayload,
    location: " ",
  });
  assert.equal(result.success, false);
});
