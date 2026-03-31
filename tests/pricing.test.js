import test from "node:test";
import assert from "node:assert/strict";
import { calculatePricing } from "../src/utils/pricingCalculator.js";

test("guidance package returns expected range", () => {
  const result = calculatePricing({
    selectedPackage: "guidance",
    additionalI130Count: 0,
    expedited: false,
  });

  assert.equal(result.minTotal, 1000);
  assert.equal(result.maxTotal, 1500);
  assert.equal(result.filingFeesIncluded, false);
});

test("filing package with add-ons returns expected range", () => {
  const result = calculatePricing({
    selectedPackage: "filing",
    additionalI130Count: 2,
    expedited: true,
  });

  assert.equal(result.minTotal, 3500);
  assert.equal(result.maxTotal, 4000);
  assert.equal(result.filingFeesIncluded, false);
});
