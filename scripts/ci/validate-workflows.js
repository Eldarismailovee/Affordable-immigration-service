#!/usr/bin/env node
/**
 * CI regression validation for GitHub Actions workflow security.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");
const workflowsDir = join(repoRoot, ".github/workflows");
const shaPattern = /^[0-9a-f]{40}$/i;
const failures = [];

function walkWorkflows(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walkWorkflows(full));
    else if (entry.endsWith(".yml") || entry.endsWith(".yaml")) files.push(full);
  }
  return files;
}

function checkFile(filePath) {
  const content = readFileSync(filePath, "utf8");
  const rel = filePath.replace(repoRoot + "/", "");

  if (/permissions:\s*write-all/m.test(content)) {
    failures.push(`${rel}: uses permissions: write-all`);
  }

  if (/continue-on-error:\s*true/m.test(content)) {
    const informational =
      rel.includes("security-scheduled") ||
      rel.includes("dast-baseline") ||
      rel.includes("codeql.yml");
    if (!informational) {
      failures.push(`${rel}: blocking workflow uses continue-on-error: true`);
    }
  }

  if (/\|\|\s*true/m.test(content)) {
    failures.push(`${rel}: uses || true to mask failures`);
  }

  if (/pull_request_target:/m.test(content)) {
    if (/actions\/checkout@m/.test(content) && /ref:\s*\$\{\{/m.test(content)) {
      failures.push(`${rel}: pull_request_target checks out untrusted ref`);
    }
  }

  const usesLines = content.match(/^\s*uses:\s*.+$/gm) || [];
  for (const line of usesLines) {
    const match = line.match(/uses:\s*([^@\s]+)@([^\s#]+)/);
    if (!match) continue;
    const [, action, ref] = match;
    if (action.startsWith("./")) continue;
    if (!shaPattern.test(ref)) {
      failures.push(`${rel}: unpinned action ${action}@${ref}`);
    }
  }

  if (!/timeout-minutes:/m.test(content) && !rel.includes("codeql.yml") && !rel.includes("dast-baseline")) {
    failures.push(`${rel}: workflow jobs missing timeout-minutes`);
  }

  const jobBlocks = content.split(/^  \w[\w-]*:\s*$/m).slice(1);
  if (jobBlocks.length === 0 && /^\s+\w[\w-]*:\s*$/m.test(content)) {
    // at least one job should have timeout — checked per file above
  }
}

for (const file of walkWorkflows(workflowsDir)) {
  checkFile(file);
}

const ciPath = join(workflowsDir, "ci.yml");
const ciContent = readFileSync(ciPath, "utf8");
if (!ciContent.includes("ci-required:")) {
  failures.push("ci.yml: missing ci-required aggregate job");
}
if (!ciContent.includes("if: always()")) {
  failures.push("ci.yml: ci-required must use if: always()");
}
if (!ciContent.includes("npm test")) {
  failures.push("ci.yml: frontend/backend must run npm test");
}
if (!ciContent.includes("RUN_MFA_PG_INTEGRATION")) {
  failures.push("ci.yml: missing MFA PG integration flag");
}
if (!ciContent.includes("RUN_EMAIL_VERIFICATION_PG_INTEGRATION")) {
  failures.push("ci.yml: missing email verification PG integration flag");
}

if (failures.length > 0) {
  console.error("Workflow validation failures:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`Workflow validation passed (${walkWorkflows(workflowsDir).length} files).`);
