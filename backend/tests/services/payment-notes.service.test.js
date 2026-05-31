import test from "node:test";
import assert from "node:assert/strict";
import {
  prepareUserPaymentNotes,
  sanitizeAdminNotes,
  textForAdminStorage,
} from "../../src/services/payment-notes.service.js";

test("prepareUserPaymentNotes rejects card-like payment notes", () => {
  assert.throws(() => prepareUserPaymentNotes("4242424242424242"), {
    code: "PAYMENT_CARD_DATA_IN_NOTES",
  });
});

test("prepareUserPaymentNotes returns default note when empty", () => {
  assert.match(prepareUserPaymentNotes(""), /secure hosted payment link/i);
});

test("sanitizeAdminNotes redacts card-like admin notes", () => {
  const result = sanitizeAdminNotes("Client gave 4242424242424242");
  assert.equal(result.redacted, true);
  assert.match(result.text, /\[REDACTED_CARD\]/);
});

test("textForAdminStorage leaves clean notes unchanged", () => {
  assert.equal(textForAdminStorage("Invoice after consult"), "Invoice after consult");
});
