import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, writeFileSync, unlinkSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";

const repoRoot = resolve(import.meta.dirname, "../..");
const ciPath = join(repoRoot, ".github/workflows/ci.yml");
const shaPattern = /^[0-9a-f]{40}$/i;

test("ci.yml exists with ci-required aggregate job", () => {
  const content = readFileSync(ciPath, "utf8");
  assert.match(content, /ci-required:/);
  assert.match(content, /if: always\(\)/);
  assert.match(content, /npm test/);
  assert.match(content, /RUN_MFA_PG_INTEGRATION/);
  assert.match(content, /RUN_EMAIL_VERIFICATION_PG_INTEGRATION/);
});

test("external actions are pinned by full SHA in ci.yml", () => {
  const content = readFileSync(ciPath, "utf8");
  const usesLines = content.match(/^\s*uses: .+$/gm) || [];
  for (const line of usesLines) {
    const match = line.match(/uses: ([^@\s]+)@([^\s#]+)/);
    if (!match) continue;
    const [, action, ref] = match;
    if (action.startsWith("./")) continue;
    assert.match(
      ref,
      shaPattern,
      `unpinned action ${action}@${ref}`
    );
  }
});

test("ci.yml does not use write-all or pull_request_target", () => {
  const content = readFileSync(ciPath, "utf8");
  assert.doesNotMatch(content, /permissions:\s*write-all/);
  assert.doesNotMatch(content, /pull_request_target:/);
  assert.doesNotMatch(content, /\|\|\s*true/);
});

test("validate-workflows.js passes on repository workflows", () => {
  execSync("node scripts/ci/validate-workflows.js", {
    cwd: repoRoot,
    stdio: "pipe",
  });
});

test("dependency and container baselines are valid JSON", () => {
  for (const file of [
    "security/dependency-audit-baseline.json",
    "security/container-scan-baseline.json",
  ]) {
    const path = join(repoRoot, file);
    assert.ok(existsSync(path));
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    assert.ok(Array.isArray(parsed.exceptions));
  }
});

test("check-npm-audit fails on expired baseline", () => {
  const baselinePath = join(repoRoot, "security/.test-expired-baseline.json");
  const content = {
    exceptions: [
      {
        advisoryId: "9999999",
        package: "fake-pkg",
        installedVersion: "1.0.0",
        dependencyPath: "fake-pkg",
        severity: "high",
        scope: "production",
        reachability: "none",
        reason: "test",
        owner: "ci",
        createdAt: "2020-01-01",
        expiresAt: "2020-01-02",
      },
    ],
  };
  writeFileSync(baselinePath, JSON.stringify(content));
  try {
    assert.throws(
      () =>
        execSync(
          `node scripts/ci/check-npm-audit.js backend ${baselinePath} --production`,
          { cwd: repoRoot, stdio: "pipe" }
        ),
      /Command failed/
    );
  } finally {
    unlinkSync(baselinePath);
  }
});
