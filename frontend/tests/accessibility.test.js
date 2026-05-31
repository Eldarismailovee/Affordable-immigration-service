import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const DOCS = path.resolve(ROOT, "..", "docs", "accessibility");

function readSrc(relativePath) {
  return readFileSync(path.join(SRC, relativePath), "utf8");
}

test("accessibility checklist docs exist", () => {
  const files = [
    "wcag-2-2-aa-checklist.md",
    "keyboard-test-plan.md",
    "contrast-test-notes.md",
    "generated-pdf-accessibility-notes.md",
  ];

  for (const file of files) {
    assert.ok(existsSync(path.join(DOCS, file)), `missing docs/accessibility/${file}`);
  }
});

test("checklist documents manual QA requirement", () => {
  const checklist = readFileSync(path.join(DOCS, "wcag-2-2-aa-checklist.md"), "utf8");
  assert.match(checklist, /Manual QA required before conformance claim/i);
  assert.match(checklist, /TODO.*manual keyboard/i);
});

test("App routes include /accessibility", () => {
  const app = readSrc("App.jsx");
  assert.match(app, /path="\/accessibility"/);
  assert.match(app, /AccessibilityPage/);
});

test("Footer links to accessibility statement", () => {
  const footer = readSrc("components/layout/Footer.jsx");
  assert.match(footer, /to="\/accessibility"/);
  assert.match(footer, /Accessibility/);
});

test("Skip link targets main content", () => {
  const skipLink = readSrc("components/layout/SkipLink.jsx");
  assert.match(skipLink, /#main-content/);
});

test("global focus-visible styles exist", () => {
  const css = readFileSync(path.join(SRC, "index.css"), "utf8");
  assert.match(css, /:focus-visible/);
  assert.match(css, /\.skip-link/);
});

test("AccessibilityPage has honest limitations copy", () => {
  const page = readSrc("pages/AccessibilityPage.jsx");
  assert.match(page, /WCAG 2\.2 Level AA/i);
  assert.match(page, /do not claim full WCAG/i);
  assert.match(page, /Known limitations/i);
  assert.match(page, /mailto:/);
});

test("key auth forms use labels and error alerts", () => {
  for (const file of ["pages/LoginPage.jsx", "pages/RegisterPage.jsx"]) {
    const source = readSrc(file);
    assert.match(source, /htmlFor=/);
    assert.match(source, /role="alert"/);
    assert.match(source, /aria-invalid=/);
  }
});

test("privacy request form uses labels and accessible errors", () => {
  const privacy = readSrc("pages/PrivacyPage.jsx");
  assert.match(privacy, /htmlFor="privacy-request-type"/);
  assert.match(privacy, /role="alert"/);
  assert.match(privacy, /role="status"/);
});

test("DocumentTitle includes accessibility route", () => {
  const titles = readSrc("components/layout/DocumentTitle.jsx");
  assert.match(titles, /\/accessibility/);
});

test("PDF service template uses lang and semantic main", () => {
  const pdfService = readFileSync(
    path.resolve(ROOT, "..", "backend", "src", "services", "pdf.service.js"),
    "utf8"
  );
  assert.match(pdfService, /lang="en"/);
  assert.match(pdfService, /<main>/);
});
