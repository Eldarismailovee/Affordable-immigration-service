import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");

function readSrc(relativePath) {
  return readFileSync(path.join(SRC, relativePath), "utf8");
}

const { familyMatterTypes, whoThisIsForCopy } = await import(
  "../src/constants/familyMatterTypes.js"
);

test("family matter types cover required categories with review caveat", () => {
  const titles = familyMatterTypes.map((matter) => matter.title);
  assert.ok(titles.includes("Spouse petitions"));
  assert.ok(titles.includes("Fiancé(e) visas"));
  assert.ok(titles.includes("Parent petitions"));
  assert.ok(titles.includes("Child petitions"));
  assert.ok(titles.includes("Sibling petitions"));
  assert.ok(titles.includes("Additional I-130 petitions"));
  assert.ok(titles.includes("Adjustment of status / consular processing"));
  assert.ok(familyMatterTypes.every((matter) => matter.status === "review_required"));
});

test("who this is for disclaimer is informational and not a guarantee", () => {
  assert.match(whoThisIsForCopy.disclaimer, /informational only/i);
  assert.match(whoThisIsForCopy.disclaimer, /does not mean your case qualifies/i);
  assert.match(whoThisIsForCopy.subjectToReview, /attorney review/i);
  assert.doesNotMatch(whoThisIsForCopy.disclaimer, /guarantee/i);
  assert.doesNotMatch(JSON.stringify(whoThisIsForCopy), /approved cases|success rate/i);
});

test("adjustment/consular copy uses review caveat only", () => {
  const adjustment = familyMatterTypes.find(
    (matter) => matter.key === "adjustment_consular"
  );
  assert.ok(adjustment);
  assert.match(adjustment.description, /reviewed after basic eligibility/i);
  assert.doesNotMatch(adjustment.description, /guarantee|we handle all/i);
});

test("who this is for section renders before pricing on home page", () => {
  const home = readSrc("pages/HomePage.jsx");
  const whoIndex = home.indexOf("<WhoThisIsForSection />");
  const pricingIndex = home.indexOf("<PricingSection />");
  const heroIndex = home.indexOf("<HeroSection />");
  const howIndex = home.indexOf("<HowItWorksSection />");

  assert.ok(whoIndex >= 0);
  assert.ok(whoIndex > heroIndex);
  assert.ok(pricingIndex > whoIndex);
  assert.ok(howIndex > whoIndex);
});

test("who this is for section includes CTAs and matter cards", () => {
  const section = readSrc("components/sections/WhoThisIsForSection.jsx");
  assert.match(section, /familyMatterTypes/);
  assert.match(section, /Start case review/);
  assert.match(section, /View pricing/);
  assert.match(section, /whoThisIsForCopy\.disclaimer/);
  assert.match(section, /unavailableMatters/);
  assert.match(section, /id="who-this-is-for"/);
});

test("public frontend source does not contain unsafe guarantee marketing claims", () => {
  const section = readSrc("components/sections/WhoThisIsForSection.jsx");
  const config = readSrc("constants/familyMatterTypes.js");
  const combined = `${section}\n${config}`;
  assert.doesNotMatch(combined, /guarantee|guaranteed|approved cases|success rate|we handle all family/i);
});
