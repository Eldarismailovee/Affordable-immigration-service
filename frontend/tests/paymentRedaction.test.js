import test from "node:test";
import assert from "node:assert/strict";
import {
  containsCardLikeData,
  isLuhnValid,
} from "../src/lib/paymentRedaction.js";

test("frontend containsCardLikeData detects test PAN", () => {
  assert.equal(containsCardLikeData("4242424242424242"), true);
});

test("frontend isLuhnValid validates Stripe test card", () => {
  assert.equal(isLuhnValid("4242424242424242"), true);
});

test("frontend containsCardLikeData ignores short IDs", () => {
  assert.equal(containsCardLikeData("matter-12345"), false);
});
