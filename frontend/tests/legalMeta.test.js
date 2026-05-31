import test from "node:test";
import assert from "node:assert/strict";

const {
  legalMeta,
  ATTORNEY_REVIEW_NOTICE,
  BAR_ADVERTISING_NOTICE,
  REFUND_CANCELLATION_NOTICE,
  SUBPROCESSORS_NOTICE,
  EU_TRANSFER_NOTICE,
} = await import("../src/data/legalMeta.js");

test("legalMeta has production-safe public copy without TODO strings", () => {
  const serialized = JSON.stringify(legalMeta);
  assert.doesNotMatch(serialized, /\bTODO\b/);
  assert.doesNotMatch(serialized, /TBD/i);
  assert.doesNotMatch(serialized, /Insert attorney/i);
  assert.doesNotMatch(serialized, /Confirm DPF/i);
  assert.doesNotMatch(serialized, /Confirm SCC/i);
});

test("legalMeta includes required notices", () => {
  assert.match(ATTORNEY_REVIEW_NOTICE, /attorney-client relationship/i);
  assert.match(BAR_ADVERTISING_NOTICE, /attorney advertising/i);
  assert.match(REFUND_CANCELLATION_NOTICE, /Refund and cancellation/i);
  assert.match(SUBPROCESSORS_NOTICE, /service providers/i);
  assert.match(EU_TRANSFER_NOTICE, /Standard Contractual Clauses/i);
  assert.equal(legalMeta.responsibleAttorney.displayMode, "pending_verified_details");
});
