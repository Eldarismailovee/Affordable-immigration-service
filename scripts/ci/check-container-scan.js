#!/usr/bin/env node
/**
 * Evaluate Trivy JSON output against expiring container baseline.
 * Usage: node scripts/ci/check-container-scan.js <trivy-json-file> [baseline-path]
 */
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const scanPath = resolve(process.argv[2]);
const baselinePath = resolve(
  process.argv[3] || join(process.cwd(), "security/container-scan-baseline.json")
);
const today = new Date().toISOString().slice(0, 10);

function fail(message) {
  console.error(`container-scan-check: ${message}`);
  process.exit(1);
}

function loadJson(path, label) {
  if (!existsSync(path)) {
    if (label === "baseline") return { exceptions: [] };
    fail(`missing ${label} at ${path}`);
  }
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    fail(`malformed ${label} JSON at ${path}`);
  }
}

function loadBaseline() {
  const parsed = loadJson(baselinePath, "baseline");
  if (!Array.isArray(parsed.exceptions)) {
    fail("container baseline must contain exceptions array");
  }
  for (const entry of parsed.exceptions) {
    for (const field of ["cve", "package", "severity", "reason", "owner", "expiresAt"]) {
      if (!entry[field]) fail(`container baseline entry missing "${field}"`);
    }
    if (entry.expiresAt < today) {
      fail(`expired container baseline ${entry.cve} for ${entry.package}`);
    }
  }
  return parsed;
}

const baseline = loadBaseline();
const baselineByKey = new Map(
  baseline.exceptions.map((e) => [`${e.cve}:${e.package}:${e.image || ""}`, e])
);

const scan = loadJson(scanPath, "scan");
const results = Array.isArray(scan.Results) ? scan.Results : [];
const violations = [];

for (const result of results) {
  const vulns = Array.isArray(result.Vulnerabilities) ? result.Vulnerabilities : [];
  for (const v of vulns) {
    const severity = (v.Severity || "").toLowerCase();
    if (severity !== "critical" && severity !== "high") continue;
    const hasFix = Boolean(v.FixedVersion);
    const key = `${v.VulnerabilityID}:${v.PkgName}:`;
    const exception = baselineByKey.get(key);
    if (exception) continue;
    if (severity === "critical" || (severity === "high" && hasFix)) {
      violations.push({
        cve: v.VulnerabilityID,
        package: v.PkgName,
        severity,
        installedVersion: v.InstalledVersion,
        fixedVersion: v.FixedVersion || null,
      });
    }
  }
}

if (violations.length > 0) {
  console.error("Blocking container vulnerabilities:");
  for (const v of violations) {
    console.error(
      `  - ${v.cve} ${v.package} (${v.severity}) installed=${v.installedVersion} fix=${v.fixedVersion}`
    );
  }
  fail(`${violations.length} blocking container finding(s)`);
}

console.log(JSON.stringify({ status: "pass", baselined: baseline.exceptions.length }, null, 2));
