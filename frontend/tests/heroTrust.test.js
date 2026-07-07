import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");

function readSrc(relativePath) {
  return readFileSync(path.join(SRC, relativePath), "utf8");
}

function collectJsxSources(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectJsxSources(fullPath, acc);
    } else if (/\.(jsx|js)$/.test(entry.name)) {
      acc.push(fullPath);
    }
  }
  return acc;
}

const {
  heroTrustSignals,
  heroCopy,
  afterSubmitSteps,
  whyTrustCards,
  beforeYouStartPoints,
  caseReviewProcessSteps,
} = await import("../src/constants/trustSignals.js");

test("hero trust config has required badges without unverified license claims", () => {
  const labels = heroTrustSignals.map((signal) => signal.label);
  assert.ok(labels.includes("Attorney-reviewed"));
  assert.ok(labels.includes("Family-based petitions"));
  assert.ok(labels.includes("Transparent flat fees"));
  assert.ok(labels.includes("Secure document upload"));
  assert.ok(labels.includes("Acceptance required"));
  assert.equal(labels.filter((label) => /licensed immigration attorney/i.test(label)).length, 0);
});

test("hero copy includes no-attorney-client relationship notice", () => {
  assert.match(heroCopy.notice, /attorney-client relationship/i);
  assert.match(heroCopy.notice, /accepted|accepts/i);
  assert.match(heroCopy.notice, /in writing/i);
  assert.doesNotMatch(heroCopy.subheadline, /guarantee/i);
  assert.doesNotMatch(heroCopy.headline, /licensed attorney/i);
});

test("hero section uses soft first-screen CTAs, not Start intake", () => {
  const hero = readSrc("components/sections/HeroSection.jsx");
  assert.match(hero, /HeroTrustBadges/);
  assert.match(hero, /BeforeYouStartCard/);
  assert.match(hero, /AttorneyTrustCard/);
  assert.match(hero, /DocumentSecurityTrustBlock/);
  assert.match(hero, /heroCopy\.primaryCta/);
  assert.match(hero, /heroCopy\.secondaryCta/);
  assert.match(hero, /heroCopy\.notice/);
  assert.doesNotMatch(hero, /Start intake/i);
  assert.equal(heroCopy.primaryCta.label, "Start case review");
  assert.equal(heroCopy.primaryCta.to, "/case-review");
  assert.equal(heroCopy.secondaryCta.label, "View pricing");
  assert.equal(heroCopy.secondaryCta.to, "#pricing");
});

test("before-you-start card covers documents, payment, time, and attorney review", () => {
  const card = readSrc("components/BeforeYouStartCard.jsx");
  assert.match(card, /beforeYouStartPoints/);
  assert.ok(beforeYouStartPoints.length >= 4);
  const combined = beforeYouStartPoints.map((point) => point.text).join(" ");
  assert.match(combined, /few minutes/i);
  assert.match(combined, /passport|financial documents/i);
  assert.match(combined, /pricing/i);
  assert.match(combined, /attorney review/i);
});

test("Start intake appears lower after process explanation, not in hero", () => {
  const home = readSrc("pages/HomePage.jsx");
  const intakeSection = readSrc("components/sections/IntakeSection.jsx");
  const howItWorks = readSrc("components/sections/HowItWorksSection.jsx");

  assert.match(intakeSection, /Start intake/);
  assert.match(intakeSection, /Ready to continue/i);
  assert.match(howItWorks, /case review/i);

  const heroIndex = home.indexOf("<HeroSection />");
  const howIndex = home.indexOf("<HowItWorksSection />");
  const intakeIndex = home.indexOf("<IntakeSection />");
  assert.ok(heroIndex >= 0);
  assert.ok(howIndex > heroIndex);
  assert.ok(intakeIndex > howIndex);
});

test("case review page is a low-pressure first step without document uploads", () => {
  const caseReview = readSrc("pages/CaseReviewPage.jsx");
  assert.match(caseReview, /caseType/);
  assert.match(caseReview, /petitionRelationship/);
  assert.match(caseReview, /location/);
  assert.match(caseReview, /email/);
  assert.match(caseReview, /attorney-client relationship/i);
  assert.doesNotMatch(caseReview, /type="file"|document upload/i);
});

test("attorney trust card does not expose internal TODO text", () => {
  const card = readSrc("components/AttorneyTrustCard.jsx");
  assert.doesNotMatch(card, /\bTODO\b/);
  assert.match(card, /Attorney review before acceptance/);
  assert.match(card, /getPublicResponsibleAttorneyProfile/);
});

test("why trust section includes process steps and document security", () => {
  const section = readSrc("components/sections/WhyTrustUsSection.jsx");
  assert.match(section, /What happens after you start a case review/);
  assert.match(section, /DocumentSecurityTrustBlock/);
  assert.doesNotMatch(section, /AcceptedMattersSummary/);
  assert.equal(afterSubmitSteps.length, 4);
  assert.equal(caseReviewProcessSteps.length, 4);
  assert.equal(whyTrustCards.length, 5);
});

test("security trust block links to privacy page", () => {
  const block = readSrc("components/DocumentSecurityTrustBlock.jsx");
  assert.match(block, /to="\/privacy"/);
  assert.match(block, /Privacy &amp; security/);
  assert.doesNotMatch(block, /SOC 2|HIPAA|bank-level/i);
});

test("home page includes who-this-is-for before pricing and pre-intake clarity after hero", () => {
  const home = readSrc("pages/HomePage.jsx");
  const heroIndex = home.indexOf("<HeroSection />");
  const whoIndex = home.indexOf("<WhoThisIsForSection />");
  const clarityIndex = home.indexOf("<PreIntakeClaritySection />");
  const pricingIndex = home.indexOf("<PricingSection />");
  assert.ok(heroIndex >= 0);
  assert.ok(whoIndex > heroIndex);
  assert.ok(clarityIndex > whoIndex);
  assert.ok(pricingIndex > whoIndex);
});

test("public frontend source does not contain fake social proof or public TODO strings", () => {
  const publicPaths = collectJsxSources(SRC).filter(
    (filePath) =>
      !filePath.includes(`${path.sep}pages${path.sep}LeadDetailPage.jsx`) &&
      !filePath.includes(`${path.sep}pages${path.sep}SiteSettingsPage.jsx`) &&
      !filePath.includes(`${path.sep}pages${path.sep}Admin`)
  );

  for (const filePath of publicPaths) {
    const source = readFileSync(filePath, "utf8");
    assert.doesNotMatch(source, /fake review|★★★★★|500\+ successful|10\+ years experience/i);
  }

  const trustConfig = readSrc("constants/trustSignals.js");
  assert.match(trustConfig, /TODO: Confirm responsible attorney/);
});

test("no testimonial or star-rating components were added to hero", () => {
  const heroRelated = [
    readSrc("components/sections/HeroSection.jsx"),
    readSrc("components/sections/WhyTrustUsSection.jsx"),
    readSrc("components/AttorneyTrustCard.jsx"),
  ].join("\n");

  assert.doesNotMatch(heroRelated, /testimonial|star.?rating|client review/i);
});
