import test from "node:test";
import assert from "node:assert/strict";
import {
  assertNoPaymentCardData,
  containsCardLikeData,
  isLuhnValid,
  redactPaymentSensitiveText,
} from "../../src/utils/paymentRedaction.js";

test("isLuhnValid accepts Stripe test card numbers", () => {
  assert.equal(isLuhnValid("4242424242424242"), true);
  assert.equal(isLuhnValid("5555555555554444"), true);
  assert.equal(isLuhnValid("4000000000000002"), true);
});

test("isLuhnValid rejects invalid long digit sequences", () => {
  assert.equal(isLuhnValid("1234567890123456"), false);
  assert.equal(isLuhnValid("12345"), false);
});

test("containsCardLikeData detects Luhn-valid PAN with spaces", () => {
  assert.equal(containsCardLikeData("Please charge 4242 4242 4242 4242 today"), true);
});

test("redactPaymentSensitiveText redacts hyphenated card numbers", () => {
  const redacted = redactPaymentSensitiveText("Card 4242-4242-4242-4242 please");
  assert.match(redacted, /\[REDACTED_CARD\]/);
  assert.doesNotMatch(redacted, /4242-4242-4242-4242/);
});

test("containsCardLikeData detects labeled CVV values", () => {
  assert.equal(containsCardLikeData("cvv: 123"), true);
  assert.equal(containsCardLikeData("security code 9999"), true);
});

test("containsCardLikeData does not flag short order IDs", () => {
  assert.equal(containsCardLikeData("Order #12345"), false);
  assert.equal(containsCardLikeData("Call me at 555-123-4567"), false);
});

test("assertNoPaymentCardData throws payment card error", () => {
  assert.throws(() => assertNoPaymentCardData("4242424242424242"), (error) => {
    assert.equal(error.code, "PAYMENT_CARD_DATA_IN_NOTES");
    return true;
  });
});
