import test from "node:test";
import assert from "node:assert/strict";

const {
  JURISDICTION_AVAILABILITY_VERSION,
  acceptedMatters,
  attorneyLicenses,
  availabilityDisclaimers,
  findUnavailableMatterMatch,
  unavailableJurisdictions,
  unavailableMatters,
  PRODUCTION_CONFIRMATION_TODO,
  JURISDICTION_REVIEW_TODO,
} = await import("../src/constants/jurisdictionAvailability.js");

test("availability config has version and placeholder licenses", () => {
  assert.equal(JURISDICTION_AVAILABILITY_VERSION, "2026-05-31-v1");
  assert.ok(attorneyLicenses.length >= 1);
  assert.match(attorneyLicenses[0].jurisdiction, /TODO/);
  assert.match(PRODUCTION_CONFIRMATION_TODO, /Confirm responsible attorney/i);
  assert.match(JURISDICTION_REVIEW_TODO, /reviewed by responsible attorney/i);
});

test("accepted matters are mapped from existing family-petition services", () => {
  assert.ok(acceptedMatters.length >= 5);
  assert.ok(
    acceptedMatters.some((matter) => matter.label === "Marriage-based green cards")
  );
  assert.ok(acceptedMatters.every((matter) => matter.status === "review_required"));
});

test("unavailable matters and jurisdictions are disclosed", () => {
  assert.ok(unavailableMatters.some((matter) => matter.key === "criminal_defense"));
  assert.ok(unavailableJurisdictions.length >= 1);
  assert.match(unavailableJurisdictions[0].jurisdiction, /TODO/);
});

test("disclaimer copy covers intake and legal advice limits", () => {
  assert.match(
    availabilityDisclaimers.notLegalAdviceBeforeReview,
    /not legal advice/i
  );
  assert.match(
    availabilityDisclaimers.attorneyReviewRequired,
    /does not mean your matter has been accepted/i
  );
  assert.match(
    availabilityDisclaimers.intakeAcknowledgment,
    /does not create an attorney-client relationship/i
  );
});

test("findUnavailableMatterMatch detects explicit unavailable matter text", () => {
  assert.equal(findUnavailableMatterMatch("criminal defense case"), unavailableMatters[0]);
  assert.equal(findUnavailableMatterMatch("marriage-based green card"), null);
  assert.equal(findUnavailableMatterMatch(""), null);
});

test("footer availability route is registered in app routes list", async () => {
  const appSource = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../src/App.jsx", import.meta.url), "utf8")
  );
  assert.match(appSource, /path="\/availability"/);
});

test("footer links to availability page", async () => {
  const footerSource = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../src/components/layout/Footer.jsx", import.meta.url), "utf8")
  );
  assert.match(footerSource, /to="\/availability"/);
});

test("availability page includes required sections", async () => {
  const pageSource = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../src/pages/AvailabilityPage.jsx", import.meta.url), "utf8")
  );
  assert.match(pageSource, /Attorney licensed jurisdictions/i);
  assert.match(pageSource, /Matters we may accept/i);
  assert.match(pageSource, /Matters not available/i);
  assert.match(pageSource, /Not legal advice before review/i);
  assert.match(pageSource, /availabilityDisclaimers\.notLegalAdviceBeforeReview/);
});

test("booking step requires availability acknowledgment", async () => {
  const bookingSource = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../src/pages/intake/BookingStepPage.jsx", import.meta.url), "utf8")
  );
  assert.match(bookingSource, /consentAvailabilityAcknowledgment/);
  assert.match(bookingSource, /availabilityDisclaimers\.intakeAcknowledgment/);
});
