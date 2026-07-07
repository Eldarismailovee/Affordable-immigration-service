import test from "node:test";
import assert from "node:assert/strict";
import { parseHostedPaymentUrl } from "../../src/utils/hostedPaymentUrl.js";

test("parseHostedPaymentUrl requires HTTPS", () => {
  assert.throws(() => parseHostedPaymentUrl("http://pay.example.com/link"), {
    code: "INVALID_HOSTED_PAYMENT_URL",
  });
});

test("parseHostedPaymentUrl rejects javascript URLs", () => {
  assert.throws(() => parseHostedPaymentUrl("javascript:alert(1)"), {
    code: "INVALID_HOSTED_PAYMENT_URL",
  });
});

test("parseHostedPaymentUrl accepts valid HTTPS URLs", () => {
  const url = parseHostedPaymentUrl("https://checkout.stripe.com/c/pay/cs_test_123");
  assert.equal(url, "https://checkout.stripe.com/c/pay/cs_test_123");
});

test("parseHostedPaymentUrl enforces host allowlist when configured", () => {
  assert.throws(
    () =>
      parseHostedPaymentUrl("https://evil.example/pay", {
        allowedHosts: ["checkout.stripe.com"],
      }),
    { code: "INVALID_HOSTED_PAYMENT_URL" }
  );

  const url = parseHostedPaymentUrl("https://checkout.stripe.com/pay", {
    allowedHosts: ["checkout.stripe.com"],
  });
  assert.match(url, /^https:\/\/checkout\.stripe\.com\//);
});

test("parseHostedPaymentUrl rejects localhost and private hosts", () => {
  for (const host of ["https://localhost/pay", "https://127.0.0.1/pay", "https://[::1]/pay"]) {
    assert.throws(() => parseHostedPaymentUrl(host), {
      code: "INVALID_HOSTED_PAYMENT_URL",
    });
  }
});

test("parseHostedPaymentUrl rejects URLs with embedded credentials", () => {
  assert.throws(() => parseHostedPaymentUrl("https://user:pass@checkout.stripe.com/pay"), {
    code: "INVALID_HOSTED_PAYMENT_URL",
  });
});

test("parseHostedPaymentUrl fails closed when allowlist is required but empty", () => {
  assert.throws(
    () =>
      parseHostedPaymentUrl("https://checkout.stripe.com/pay", {
        allowedHosts: [],
        requireAllowlist: true,
      }),
    { code: "INVALID_HOSTED_PAYMENT_URL" }
  );
});
