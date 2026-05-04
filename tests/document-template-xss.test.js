import test from "node:test";
import assert from "node:assert/strict";
import { generateAgreement } from "../backend/src/services/agreement.service.js";
import { generateOnboardingPacket } from "../backend/src/services/onboarding.service.js";
import { escapeHtml } from "../backend/src/utils/htmlEscape.js";

const maliciousPayload = {
  selectedPackage: "filing",
  firstName: `<img src=x onerror="alert('xss')">`,
  lastName: `<script>alert("last")</script>`,
  email: "client@example.com",
  phone: `<svg onload=alert(1)>`,
  caseType: `Marriage <strong>based</strong> & "quoted"`,
  additionalI130Count: 1,
  expedited: true,
};

test("escapeHtml converts user text into safe HTML text", () => {
  assert.equal(
    escapeHtml(`<script>alert("xss")</script> & 'quoted'`),
    "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &#39;quoted&#39;"
  );
});

test("agreement template escapes user-provided values", () => {
  const { html } = generateAgreement(maliciousPayload);

  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /<img/i);
  assert.doesNotMatch(html, /<svg/i);
  assert.doesNotMatch(html, /onerror="/i);
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(&#39;xss&#39;\)&quot;&gt;/);
  assert.match(html, /Marriage &lt;strong&gt;based&lt;\/strong&gt; &amp; &quot;quoted&quot;/);
});

test("onboarding template escapes user-provided values", () => {
  const { html } = generateOnboardingPacket(maliciousPayload);

  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /<img/i);
  assert.doesNotMatch(html, /<svg/i);
  assert.doesNotMatch(html, /onerror="/i);
  assert.match(html, /&lt;script&gt;alert\(&quot;last&quot;\)&lt;\/script&gt;/);
  assert.match(html, /Marriage &lt;strong&gt;based&lt;\/strong&gt; &amp; &quot;quoted&quot;/);
});
