import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("email preferences checkboxes are not pre-checked by default in page source", () => {
  const source = readFileSync(join(root, "src/pages/EmailPreferencesPage.jsx"), "utf8");
  assert.match(source, /useState\(false\)/);
  assert.doesNotMatch(source, /checked=\{true\}/);
});

test("unsubscribe page calls public unsubscribe API", () => {
  const source = readFileSync(join(root, "src/pages/UnsubscribePage.jsx"), "utf8");
  assert.match(source, /confirmUnsubscribe/);
  assert.match(source, /unsubscribed from marketing/i);
});
