import { before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "crypto";
import { clearStore, setupTestEnvironment } from "../helpers/buildTestApp.js";
import { makeAdmin } from "../helpers/authTestHelpers.js";
import { withApp } from "../helpers/httpClient.js";

let app;
let store;

before(async () => {
  ({ app, store } = await setupTestEnvironment());
});

beforeEach(() => {
  clearStore(store);
});

async function registerAndLogin(client, { email, password = "longenough1", fullName = "Demo" }) {
  const res = await client.post("/api/auth/register", { fullName, email, password });
  assert.equal(res.status, 201);
  return res.body;
}

function seedPayment(leadId) {
  const paymentId = randomUUID();
  store.payments.set(paymentId, {
    id: paymentId,
    lead_id: leadId,
    amount_min: 1000,
    amount_max: 2000,
    status: "pending_manual_processing",
    manual_review: true,
    notes: "Payment via secure hosted payment link",
    notes_redacted: false,
    billing_name: "Test",
    billing_email: "test@example.com",
    payment_preference: "invoice",
    consent_manual_processing: true,
    payment_method: "payment_link",
    hosted_payment_url: null,
    provider: null,
    provider_reference: null,
    created_at: new Date(),
    updated_at: new Date(),
  });
  return leadId;
}

test("PATCH /api/admin/payments/:leadId/hosted-url rejects non-HTTPS URLs", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client, store);
    const leadId = randomUUID();
    seedPayment(leadId);

    const res = await client.patch(
      `/api/admin/payments/${leadId}/hosted-url`,
      { hostedPaymentUrl: "http://pay.example.com/x" },
      { token: adminSession.token }
    );

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "INVALID_HOSTED_PAYMENT_URL");
  });
});

test("PATCH /api/admin/payments/:leadId/hosted-url saves HTTPS hosted link", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client, store);
    const leadId = randomUUID();
    seedPayment(leadId);

    const res = await client.patch(
      `/api/admin/payments/${leadId}/hosted-url`,
      {
        hostedPaymentUrl: "https://checkout.stripe.com/c/pay/cs_test_abc",
        provider: "stripe",
        providerReference: "cs_test_abc",
      },
      { token: adminSession.token }
    );

    assert.equal(res.status, 200);
    assert.equal(
      res.body.payment.hosted_payment_url,
      "https://checkout.stripe.com/c/pay/cs_test_abc"
    );
    assert.equal(res.body.payment.provider, "stripe");
  });
});

test("PATCH /api/admin/payments/:leadId/status rejects unknown statuses", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client, store);
    const leadId = randomUUID();
    seedPayment(leadId);

    const res = await client.patch(
      `/api/admin/payments/${leadId}/status`,
      { status: "refunded" },
      { token: adminSession.token }
    );

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "VALIDATION_FAILED");
  });
});
