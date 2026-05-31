import test from "node:test";
import assert from "node:assert/strict";
import {
  assertConflictCheckClear,
  assertLeadCanGenerateAgreement,
  assertLeadCanGenerateFilingPacket,
  assertLeadCanMoveToEngaged,
  CONFLICT_CHECK_RESULTS,
} from "../../src/domain/lead-workflow.policy.js";
import { getPublicResponsibleAttorneyProfile } from "../../src/constants/responsibleAttorney.js";
import { evaluateJurisdictionAvailability } from "../../src/constants/jurisdictionAvailability.js";

test("assertConflictCheckClear requires clear result", () => {
  assert.doesNotThrow(() =>
    assertConflictCheckClear({ result: CONFLICT_CHECK_RESULTS.CLEAR })
  );
  assert.throws(() => assertConflictCheckClear({ result: "pending" }), {
    code: "CONFLICT_CHECK_NOT_CLEAR",
  });
});

test("assertLeadCanGenerateAgreement blocks before attorney review", () => {
  assert.throws(
    () =>
      assertLeadCanGenerateAgreement({
        status: "accepted",
        attorney_review_status: "pending",
        responsible_attorney_confirmed: true,
      }),
    { code: "ATTORNEY_REVIEW_NOT_ACCEPTED" }
  );
});

test("assertLeadCanGenerateFilingPacket requires engaged status", () => {
  assert.throws(
    () =>
      assertLeadCanGenerateFilingPacket({
        status: "accepted",
        attorney_review_status: "accepted",
        conflict_check_result: CONFLICT_CHECK_RESULTS.CLEAR,
      }),
    { code: "LEAD_STATUS_BLOCKS_FILING_PACKET" }
  );
});

test("assertLeadCanMoveToEngaged requires conflict check clear and acceptance", () => {
  assert.throws(
    () =>
      assertLeadCanMoveToEngaged({
        status: "accepted",
        attorney_review_status: "accepted",
        conflict_check_result: "pending",
        responsible_attorney_confirmed: true,
      }),
    { code: "CONFLICT_CHECK_NOT_CLEAR" }
  );
});

test("responsible attorney profile does not publish unverified license facts", () => {
  const profile = getPublicResponsibleAttorneyProfile();
  assert.equal(profile.configured, false);
  assert.equal(profile.pendingVerification, true);
  assert.equal(profile.name, null);
  assert.match(profile.publicText, /engagement materials/i);
});

test("jurisdiction unavailable blocks automatic acceptance", () => {
  const result = evaluateJurisdictionAvailability({ matterType: "criminal defense" });
  assert.equal(result.available, false);
  assert.equal(result.reviewRequired, false);
});

test("unknown jurisdiction requires review", () => {
  const result = evaluateJurisdictionAvailability({ matterType: "marriage-based green card" });
  assert.equal(result.reviewRequired, true);
});
