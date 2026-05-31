import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const REPO_ROOT = path.resolve(ROOT, "..");
const SECURITY_DOCS = path.join(REPO_ROOT, "docs", "security");
const WORKFLOWS = path.join(REPO_ROOT, ".github", "workflows");

function readSrc(relativePath) {
  return readFileSync(path.join(SRC, relativePath), "utf8");
}

test("auth tokens are kept in memory, not localStorage", () => {
  const api = readSrc("services/api.js");

  assert.doesNotMatch(api, /localStorage\.(setItem|getItem).*token/i);
  assert.doesNotMatch(api, /sessionStorage\.(setItem|getItem).*token/i);
  assert.match(api, /let accessToken = null/);
  assert.match(api, /credentials:\s*"include"/);
});

test("index.html does not use dangerous inline scripts", () => {
  const html = readFileSync(path.join(ROOT, "index.html"), "utf8");

  assert.doesNotMatch(html, /<script(?![^>]*type="module")[^>]*>/i);
  assert.match(html, /type="module"/);
});

test("security docs and CI workflows exist", () => {
  const docs = [
    "security-hardening-checklist.md",
    "document-encryption-at-rest.md",
    "backup-restore-runbook.md",
    "incident-response-plan.md",
    "secret-scanning.md",
  ];

  for (const file of docs) {
    assert.ok(existsSync(path.join(SECURITY_DOCS, file)), `missing docs/security/${file}`);
  }

  assert.ok(existsSync(path.join(WORKFLOWS, "codeql.yml")), "missing .github/workflows/codeql.yml");
  assert.ok(
    existsSync(path.join(WORKFLOWS, "dast-baseline.yml")),
    "missing .github/workflows/dast-baseline.yml"
  );
});

test("security hardening checklist covers token and scanning controls", () => {
  const checklist = readFileSync(
    path.join(SECURITY_DOCS, "security-hardening-checklist.md"),
    "utf8"
  );

  assert.match(checklist, /HttpOnly cookie/i);
  assert.match(checklist, /CodeQL workflow/i);
  assert.match(checklist, /secret scanning/i);
});
