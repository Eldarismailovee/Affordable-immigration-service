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

function linesWithFontMono(relativePath) {
  return readSrc(relativePath)
    .split("\n")
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(({ line }) => line.includes("font-mono"));
}

const indexCss = readFileSync(path.join(SRC, "index.css"), "utf8");
const indexHtml = readFileSync(path.join(ROOT, "index.html"), "utf8");

test("global body font stack uses Inter sans-serif", () => {
  assert.match(indexCss, /--font-sans:\s*"Inter"/);
  assert.match(indexCss, /font-family:\s*var\(--font-sans\)/);
  assert.match(indexHtml, /fonts\.googleapis\.com.*Inter/i);
});

test("hero subheadline and notice are sans-readable, not monospace", () => {
  const hero = readSrc("components/sections/HeroSection.jsx");
  assert.match(hero, /heroCopy\.subheadline/);
  assert.match(hero, /text-lg leading-8 text-slate-300/);
  assert.match(hero, /text-base leading-7 text-slate-400"\s*\n\s*role="note"/);
  assert.doesNotMatch(hero, /<p[^>]*font-mono[^>]*>[\s\S]*heroCopy\.subheadline/);
});

test("pricing descriptions and legal caveats use readable sans typography", () => {
  const pricing = readSrc("components/sections/PricingSection.jsx");
  assert.match(pricing, /<p className="mt-3 text-base leading-7 text-slate-600">\s*\{item\.description\}/);
  assert.match(pricing, /Excluded costs:/);
  assert.match(pricing, /mt-8 max-w-3xl text-base leading-7/);
  assert.match(pricing, /No guarantee of outcome:/);
  assert.match(pricing, /mt-6 max-w-3xl text-base leading-7/);
  assert.match(pricing, /font-mono text-4xl/);
});

test("legal page layout uses readable sans body typography", () => {
  const legal = readSrc("components/legal/LegalPageLayout.jsx");
  assert.match(
    legal,
    /rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-base leading-7 text-amber-950">\s*\{ATTORNEY_REVIEW_NOTICE\}/
  );
  assert.match(legal, /max-w-4xl space-y-6[\s\S]*text-base leading-7 text-slate-700/);
  assert.match(readSrc("components/legal/LegalSection.jsx"), /readable-prose/);
});

test("FAQ answers use base readable text without monospace", () => {
  const faq = readSrc("components/ui/FaqItem.jsx");
  assert.match(faq, /text-base leading-7/);
  assert.doesNotMatch(faq, /font-mono/);
});

test("font-mono on p tags is limited to short accent labels", () => {
  const publicPaths = collectJsxSources(SRC).filter(
    (filePath) =>
      !filePath.includes(`${path.sep}pages${path.sep}Admin`) &&
      !filePath.includes(`${path.sep}LeadDetailPage.jsx`) &&
      !filePath.includes(`${path.sep}SiteSettingsPage.jsx`)
  );

  for (const filePath of publicPaths) {
    const relativePath = path.relative(SRC, filePath);
    const monoLines = linesWithFontMono(relativePath).filter(({ line }) =>
      /<p\b/.test(line)
    );

    for (const { line, number } of monoLines) {
      assert.match(
        line,
        /uppercase|tracking|price|Step \d|Case review|Responsible attorney|Before representation/i,
        `${relativePath}:${number} uses font-mono on a paragraph outside allowed accent labels`
      );
    }
  }
});

test("typography QA checklist doc exists", () => {
  const qaDoc = readFileSync(
    path.resolve(ROOT, "..", "docs", "ux", "typography-readability-qa.md"),
    "utf8"
  );
  assert.match(qaDoc, /Body text uses sans-serif/);
  assert.match(qaDoc, /Monospace is limited/);
});

test("monospace accents remain on section eyebrows and step labels", () => {
  assert.match(readSrc("components/layout/SectionTitle.jsx"), /font-mono text-xs/);
  assert.match(readSrc("components/sections/HowItWorksSection.jsx"), /font-mono text-sm font-semibold uppercase/);
  assert.match(readSrc("pages/intake/PackageStepPage.jsx"), /font-mono text-sm uppercase tracking/);
});
