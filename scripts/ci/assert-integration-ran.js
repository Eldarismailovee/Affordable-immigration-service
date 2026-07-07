#!/usr/bin/env node
/**
 * Parse node --test output and fail if expected integration tests were skipped.
 * Usage: node scripts/ci/assert-integration-ran.js <test-output-file> <test-name>...
 */
import { readFileSync } from "node:fs";

const outputPath = process.argv[2];
const expectedTests = process.argv.slice(3);

if (!outputPath || expectedTests.length === 0) {
  console.error("Usage: assert-integration-ran.js <output-file> <test-name>...");
  process.exit(1);
}

const output = readFileSync(outputPath, "utf8");
const failures = [];

for (const name of expectedTests) {
  const skippedPattern = new RegExp(`${name}[\\s\\S]*?# SKIP`, "m");
  const passPattern = new RegExp(`${name}[\\s\\S]*?# PASS`, "m");
  const failPattern = new RegExp(`${name}[\\s\\S]*?# FAIL`, "m");

  if (skippedPattern.test(output)) {
    failures.push(`${name} was SKIPPED`);
  } else if (!passPattern.test(output) && !failPattern.test(output)) {
    failures.push(`${name} was not found in test output`);
  }
}

if (failures.length > 0) {
  console.error("Integration test assertion failures:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`All ${expectedTests.length} integration test(s) executed (not skipped).`);
