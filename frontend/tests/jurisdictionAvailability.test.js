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
  RESPONSIBLE_ATTORNEY_PUBLIC_TEXT,
} = await import("../src/constants/jurisdictionAvailability.js");

test("availability config has version and no placeholder license rows", () => {
  assert.equal(JURISDICTION_AVAILABILITY_VERSION, "2026-05-31-v1");
  assert.equal(attorneyLicenses.length, 0);
  assert.match(RESPONSIBLE_ATTORNEY_PUBLIC_TEXT, /engagement materials/i);
});

test("accepted matters are mapped from existing family-petition services", () => {
  assert.ok(acceptedMatters.length >= 5);
  assert.ok(
    acceptedMatters.some((matter) => matter.label === "Marriage-based green cards")
  );
  assert.ok(acceptedMatters.every((matter) => matter.status === "review_required"));
});

test("unavailable matters are disclosed; jurisdiction list is empty until confirmed", () => {
  assert.ok(unavailableMatters.some((matter) => matter.key === "criminal_defense"));
  assert.equal(unavailableJurisdictions.length, 0);
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
  assert.match(
    availabilityDisclaimers.advertisingNotice,
    /attorney advertising/i
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

test("legal pages do not render visible TODO strings", async () => {
  const fs = await import("node:fs/promises");
  const legalPaths = [
    "../src/pages/PrivacyPage.jsx",
    "../src/pages/TermsPage.jsx",
    "../src/pages/DisclaimerPage.jsx",
    "../src/pages/AvailabilityPage.jsx",
    "../src/components/legal/LegalPageLayout.jsx",
  ];

  for (const relativePath of legalPaths) {
    const source = await fs.readFile(new URL(relativePath, import.meta.url), "utf8");
    assert.doesNotMatch(source, /\bTODO\b/);
    assert.doesNotMatch(source, /Insert attorney/i);
    assert.doesNotMatch(source, /Confirm DPF/i);
  }

  const { legalMeta } = await import("../src/data/legalMeta.js");
  const publicCopy = JSON.stringify(legalMeta);
  assert.doesNotMatch(publicCopy, /\bTODO\b/);
  assert.doesNotMatch(publicCopy, /Insert attorney/i);
});

test("booking step requires availability acknowledgment", async () => {
  const bookingSource = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("../src/pages/intake/BookingStepPage.jsx", import.meta.url), "utf8")
  );
  assert.match(bookingSource, /consentAvailabilityAcknowledgment/);
  assert.match(bookingSource, /availabilityDisclaimers\.intakeAcknowledgment/);
});
