#!/usr/bin/env node
/**
 * Fail-closed npm audit checker with expiring baseline exceptions.
 * Usage: node scripts/ci/check-npm-audit.js <package-dir>
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const rawArgs = process.argv.slice(2).filter((a) => a !== "--production");
const packageDir = resolve(rawArgs[0] || ".");
const baselinePath = resolve(
  rawArgs[1] || join(process.cwd(), "security/dependency-audit-baseline.json")
);
const scope = process.argv.includes("--production") ? "production" : "all";
const today = new Date().toISOString().slice(0, 10);

function fail(message) {
  console.error(`npm-audit-check: ${message}`);
  process.exit(1);
}

function loadBaseline() {
  if (!existsSync(baselinePath)) {
    return { exceptions: [] };
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(baselinePath, "utf8"));
  } catch {
    fail(`malformed baseline JSON at ${baselinePath}`);
  }
  if (!Array.isArray(parsed.exceptions)) {
    fail("baseline must contain an exceptions array");
  }
  for (const entry of parsed.exceptions) {
    for (const field of [
      "advisoryId",
      "package",
      "installedVersion",
      "severity",
      "scope",
      "reason",
      "owner",
      "createdAt",
      "expiresAt",
    ]) {
      if (!entry[field]) {
        fail(`baseline entry missing required field "${field}"`);
      }
    }
    if (entry.expiresAt < today) {
      fail(
        `expired baseline exception ${entry.advisoryId} for ${entry.package} (expired ${entry.expiresAt})`
      );
    }
  }
  return parsed;
}

function runAudit() {
  const omitDev = scope === "production" ? " --omit=dev" : "";
  let stdout;
  try {
    stdout = execSync(`npm audit --json${omitDev}`, {
      cwd: packageDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    if (error.stdout) {
      stdout = error.stdout;
    } else {
      fail(`npm audit execution failed: ${error.message}`);
    }
  }
  let report;
  try {
    report = JSON.parse(stdout);
  } catch {
    fail("npm audit returned invalid JSON");
  }
  if (!report.vulnerabilities || !report.metadata) {
    fail("npm audit JSON missing vulnerabilities or metadata");
  }
  return report;
}

function collectFindings(report) {
  const findings = [];
  for (const [pkgName, entry] of Object.entries(report.vulnerabilities)) {
    const via = Array.isArray(entry.via) ? entry.via : [];
    for (const item of via) {
      if (typeof item === "string") continue;
      findings.push({
        advisoryId: String(item.source),
        package: item.name || pkgName,
        installedVersion: entry.range || "unknown",
        severity: item.severity || entry.severity,
        url: item.url || "",
        dependencyPath: pkgName,
        fixAvailable: entry.fixAvailable === true,
      });
    }
  }
  return findings;
}

function severityRank(severity) {
  const order = { critical: 4, high: 3, moderate: 2, low: 1, info: 0 };
  return order[severity] ?? 0;
}

const baseline = loadBaseline();
const baselineById = new Map(
  baseline.exceptions.map((e) => [`${e.advisoryId}:${e.package}`, e])
);
const report = runAudit();
const findings = collectFindings(report);
const blocking = findings.filter((f) => severityRank(f.severity) >= severityRank("high"));
const unbaselined = [];
const baselined = [];

for (const finding of blocking) {
  const key = `${finding.advisoryId}:${finding.package}`;
  const exception = baselineById.get(key);
  if (!exception) {
    unbaselined.push(finding);
    continue;
  }
  if (exception.installedVersion !== finding.installedVersion) {
    fail(
      `baseline version mismatch for ${finding.advisoryId}/${finding.package}: ` +
        `baseline=${exception.installedVersion}, actual=${finding.installedVersion}`
    );
  }
  baselined.push({ finding, exception });
}

const usedKeys = new Set(baselined.map((b) => `${b.finding.advisoryId}:${b.finding.package}`));
for (const entry of baseline.exceptions) {
  const key = `${entry.advisoryId}:${entry.package}`;
  const stillPresent = blocking.some(
    (f) => `${f.advisoryId}:${f.package}` === key
  );
  if (!stillPresent && entry.scope === "production") {
    console.warn(
      `npm-audit-check: baseline entry ${key} no longer appears in audit — review for removal`
    );
  }
  if (entry.scope === "production" && !findings.some((f) => `${f.advisoryId}:${f.package}` === key)) {
    // advisory resolved — informational only
  }
}

if (unbaselined.length > 0) {
  console.error("Unbaselined Critical/High vulnerabilities:");
  for (const f of unbaselined) {
    console.error(
      `  - ${f.advisoryId} ${f.package} (${f.severity}) path=${f.dependencyPath} fix=${f.fixAvailable}`
    );
  }
  fail(`${unbaselined.length} unbaselined Critical/High finding(s)`);
}

console.log(
  JSON.stringify(
    {
      packageDir,
      scope,
      total: report.metadata.vulnerabilities.total,
      high: report.metadata.vulnerabilities.high,
      critical: report.metadata.vulnerabilities.critical,
      baselined: baselined.length,
      status: "pass",
    },
    null,
    2
  )
);
