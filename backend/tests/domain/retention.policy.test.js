import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDocumentAnonymizationPatch,
  buildLeadAnonymizationPatch,
  isInactiveLeadEligibleForAnonymization,
  isLegalHoldActive,
  isRetentionDue,
  isScheduledAnonymizationDue,
  parseRetentionCliArgs,
} from "../../src/domain/retention.policy.js";

const LEAD_ID = "11111111-1111-4111-8111-111111111111";

test("isLegalHoldActive returns true only when legal_hold is true", () => {
  assert.equal(isLegalHoldActive({ legal_hold: true }), true);
  assert.equal(isLegalHoldActive({ legal_hold: false }), false);
  assert.equal(isLegalHoldActive(null), false);
});

test("isRetentionDue respects legal hold and retention_until", () => {
  const cutoff = new Date("2024-01-01T00:00:00.000Z");
  assert.equal(
    isRetentionDue({ created_at: "2023-01-01T00:00:00.000Z", legal_hold: false }, cutoff),
    true
  );
  assert.equal(
    isRetentionDue({ created_at: "2023-01-01T00:00:00.000Z", legal_hold: true }, cutoff),
    false
  );
  assert.equal(
    isRetentionDue(
      { retention_until: "2026-01-01T00:00:00.000Z", legal_hold: false },
      cutoff
    ),
    true
  );
});

test("isScheduledAnonymizationDue requires scheduled time in the past", () => {
  assert.equal(
    isScheduledAnonymizationDue({
      scheduled_anonymization_at: "2020-01-01T00:00:00.000Z",
      legal_hold: false,
    }),
    true
  );
  assert.equal(
    isScheduledAnonymizationDue({
      scheduled_anonymization_at: "2099-01-01T00:00:00.000Z",
      legal_hold: false,
    }),
    false
  );
});

test("inactive lead eligibility excludes engaged and filed leads", () => {
  const cutoff = new Date("2024-01-01T00:00:00.000Z");
  assert.equal(
    isInactiveLeadEligibleForAnonymization(
      { status: "new", updated_at: "2023-01-01T00:00:00.000Z", legal_hold: false },
      cutoff
    ),
    true
  );
  assert.equal(
    isInactiveLeadEligibleForAnonymization(
      { status: "engaged", updated_at: "2023-01-01T00:00:00.000Z", legal_hold: false },
      cutoff
    ),
    false
  );
  assert.equal(
    isInactiveLeadEligibleForAnonymization(
      { status: "declined", updated_at: "2023-01-01T00:00:00.000Z", legal_hold: true },
      cutoff
    ),
    false
  );
});

test("anonymization patches redact identifying fields", () => {
  const leadPatch = buildLeadAnonymizationPatch(LEAD_ID);
  assert.equal(leadPatch.firstName, "Deleted");
  assert.match(leadPatch.email, /anonymized\+/);

  const docPatch = buildDocumentAnonymizationPatch();
  assert.equal(docPatch.title, "deleted-file");
  assert.equal(docPatch.htmlContent, "");
});

test("parseRetentionCliArgs parses dry run, limit, and categories", () => {
  const parsed = parseRetentionCliArgs([
    "--dry-run",
    "--limit=250",
    "--categories=technical_log,auth_session",
    "--reason=scheduled nightly retention job",
  ]);

  assert.equal(parsed.dryRun, true);
  assert.equal(parsed.limit, 250);
  assert.deepEqual(parsed.categories, ["technical_log", "auth_session"]);
  assert.match(parsed.reason, /scheduled nightly/);
});
