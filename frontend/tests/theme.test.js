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

const homePage = readSrc("pages/HomePage.jsx");
const heroSection = readSrc("components/sections/HeroSection.jsx");
const pricingSection = readSrc("components/sections/PricingSection.jsx");
const legalLayout = readSrc("components/legal/LegalPageLayout.jsx");
const intakeLayout = readSrc("pages/intake/IntakeLayout.jsx");
const caseReviewPage = readSrc("pages/CaseReviewPage.jsx");
const indexCss = readFileSync(path.join(SRC, "index.css"), "utf8");

const lightSectionFiles = [
  "components/sections/WhoThisIsForSection.jsx",
  "components/sections/HowItWorksSection.jsx",
  "components/sections/PricingSection.jsx",
  "components/sections/FAQSection.jsx",
  "components/sections/IntakeSection.jsx",
];

test("home page uses light page surface instead of full dark background", () => {
  assert.match(homePage, /pageSurfaceClass/);
  assert.doesNotMatch(homePage, /bg-\[#040816\]/);
  assert.doesNotMatch(homePage, /text-white/);
});

test("hero remains dark premium while content below is light-first", () => {
  assert.match(heroSection, /heroSurfaceClass/);
  assert.match(heroSection, /bg-\[#0B1220\]|heroSurfaceClass/);
});

test("main landing content sections use light readable surfaces", () => {
  for (const relativePath of lightSectionFiles) {
    const source = readSrc(relativePath);
    assert.match(
      source,
      /sectionLightClass|sectionAltClass|bg-white|bg-stone-50|text-slate-/,
      `${relativePath} should use light section styling`
    );
    assert.doesNotMatch(
      source,
      /bg-slate-950\/|bg-\[#040816\]|border-white\/10 bg-white\/5/,
      `${relativePath} should not rely on dark card styling`
    );
  }
});

test("pricing section uses light cards and readable body text", () => {
  assert.match(pricingSection, /text-slate-600/);
  assert.match(pricingSection, /border-slate-200 bg-white/);
  assert.match(pricingSection, /Excluded costs:/);
});

test("legal pages use readable light layout", () => {
  assert.match(legalLayout, /pageSurfaceClass/);
  assert.match(legalLayout, /text-slate-950/);
  assert.match(legalLayout, /cardSurfaceClass/);
  assert.doesNotMatch(legalLayout, /bg-\[#040816\]/);
});

test("forms and intake use light official surfaces", () => {
  assert.match(intakeLayout, /pageSurfaceClass/);
  assert.match(intakeLayout, /formSurfaceClass/);
  assert.match(caseReviewPage, /formInputClass/);
  assert.match(caseReviewPage, /formSurfaceClass/);
  assert.doesNotMatch(caseReviewPage, /bg-\[#040816\]/);
});

test("global body defaults to light readable theme", () => {
  assert.match(indexCss, /background:\s*#fafaf9/);
  assert.match(indexCss, /color:\s*#0f172a/);
});

test("theme trust QA checklist doc exists", () => {
  const qaDoc = readFileSync(
    path.resolve(ROOT, "..", "docs", "ux", "theme-trust-qa.md"),
    "utf8"
  );
  assert.match(qaDoc, /Hero can be dark\/premium/);
  assert.match(qaDoc, /Main content sections are light\/readable/);
});

test("public content sections are not all dark backgrounds", () => {
  const sectionDir = path.join(SRC, "components", "sections");
  const sectionFiles = readdirSync(sectionDir).filter((name) => name.endsWith(".jsx"));

  let darkOnlySections = 0;
  let lightSections = 0;

  for (const fileName of sectionFiles) {
    if (fileName === "HeroSection.jsx") {
      continue;
    }

    const source = readFileSync(path.join(sectionDir, fileName), "utf8");
    if (/sectionLightClass|sectionAltClass|bg-stone-50|bg-white/.test(source)) {
      lightSections += 1;
    }
    if (/bg-\[#040816\]|min-h-screen bg-slate-950/.test(source)) {
      darkOnlySections += 1;
    }
  }

  assert.ok(lightSections >= 6);
  assert.equal(darkOnlySections, 0);
});
