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

const pricingSection = readSrc("components/sections/PricingSection.jsx");
const pricingData = readSrc("data/pricing.js");
const faqData = readSrc("data/faq.js");
const packageStep = readSrc("pages/intake/PackageStepPage.jsx");
const allFrontendSrc = collectJsxSources(SRC).map((filePath) => readFileSync(filePath, "utf8")).join("\n");

const pricingCombined = [pricingSection, pricingData, faqData, packageStep].join("\n");

test("pricing no longer contains risky timeline claim", () => {
  assert.doesNotMatch(pricingCombined, /Filed within 2 weeks after complete docs/i);
  assert.doesNotMatch(pricingCombined, /will be filed within two weeks/i);
  assert.doesNotMatch(pricingCombined, /guarantees filing within/i);
});

test("pricing contains safer preparation target language", () => {
  assert.match(pricingCombined, /Preparation target|Internal preparation target/i);
  assert.match(pricingCombined, /after all required documents/i);
  assert.match(pricingCombined, /matter is accepted/i);
});

test("pricing contains excluded-costs note with USCIS and third-party costs", () => {
  assert.match(pricingCombined, /USCIS/i);
  assert.match(pricingCombined, /translations/i);
  assert.match(pricingCombined, /medical exams/i);
  assert.match(pricingCombined, /mailing/i);
  assert.match(pricingCombined, /third-party/i);
  assert.match(pricingCombined, /not included/i);
});

test("pricing does not imply guaranteed filing or approval", () => {
  assert.doesNotMatch(pricingCombined, /guaranteed filing/i);
  assert.doesNotMatch(pricingCombined, /guaranteed approval/i);
  assert.doesNotMatch(pricingCombined, /All fees included/i);
  assert.doesNotMatch(pricingCombined, /Processing promise/i);
});

test("package label changed from Attorney Filing to safer name", () => {
  assert.doesNotMatch(pricingData, /Attorney Filing/);
  assert.match(pricingData, /Attorney-prepared filing package/);
  assert.match(pricingData, /Additional forms \/ add-ons/);
});

test("pricing includes attorney-review and acceptance caveat", () => {
  assert.match(pricingSection, /conflict check/i);
  assert.match(pricingSection, /attorney review/i);
  assert.match(pricingSection, /written acceptance/i);
});

test("pricing FAQ includes legal-safe answers", () => {
  assert.match(faqData, /Are USCIS fees included\?/);
  assert.match(faqData, /Is the 2-week timeline guaranteed\?/);
  assert.match(faqData, /What happens if my matter is not accepted\?/);
  assert.match(faqData, /not a guarantee of filing date/i);
});

test("frontend src does not contain unsafe Attorney Filing label", () => {
  assert.doesNotMatch(allFrontendSrc, /Attorney Filing/);
});
