import { before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "crypto";
import { clearStore, setupTestEnvironment } from "../helpers/buildTestApp.js";
import { makeAdmin, verifyUserEmail } from "../helpers/authTestHelpers.js";
import { withApp } from "../helpers/httpClient.js";
import { AUDIT_EVENT_TYPES } from "../../src/constants/audit.js";

let app;
let store;

before(async () => {
  ({ app, store } = await setupTestEnvironment());
});

beforeEach(() => {
  clearStore(store);
});

function auditEvents(eventType) {
  return store.auditEvents.filter((entry) => entry.event_type === eventType);
}

function assertNoSensitiveAuditPayload() {
  const serialized = JSON.stringify(store.auditEvents);
  assert.ok(!serialized.includes("wrong-password"));
  assert.ok(!serialized.includes("correct-password"));
  assert.ok(!serialized.includes("4111111111111111"));
}

async function registerAdmin(client) {
  return makeAdmin(client, store);
}

async function registerSecondUser(client, email = "user@example.com") {
  const res = await client.post("/api/auth/register", {
    fullName: "User",
    email,
    password: "longenough1",
  });
  assert.equal(res.status, 201);
  verifyUserEmail(store, email);
  return res.body;
}

test("successful login creates auth.login.success audit event", async () => {
  await withApp(app, async (client) => {
    await client.post("/api/auth/register", {
      fullName: "Admin",
      email: "admin@example.com",
      password: "longenough1",
    });
    client.clearCookies();

    const login = await client.post("/api/auth/login", {
      email: "admin@example.com",
      password: "longenough1",
    });
    assert.equal(login.status, 200);

    const events = auditEvents(AUDIT_EVENT_TYPES.AUTH_LOGIN_SUCCESS);
    assert.equal(events.length, 1);
    assert.equal(events[0].result, "success");
    assert.ok(events[0].actor_user_id);
    assert.equal(events[0].target_type, "user");
    assertNoSensitiveAuditPayload();
  });
});

test("failed login creates auth.login.failure without password in audit payload", async () => {
  await withApp(app, async (client) => {
    await client.post("/api/auth/register", {
      fullName: "Admin",
      email: "admin@example.com",
      password: "longenough1",
    });
    client.clearCookies();

    const res = await client.post("/api/auth/login", {
      email: "admin@example.com",
      password: "wrong-password",
    });
    assert.equal(res.status, 401);

    const events = auditEvents(AUDIT_EVENT_TYPES.AUTH_LOGIN_FAILURE);
    assert.equal(events.length, 1);
    assert.equal(events[0].result, "failure");
    assert.equal(events[0].reason_code, "invalid_credentials");
    assertNoSensitiveAuditPayload();
  });
});

test("logout creates auth.logout audit event", async () => {
  await withApp(app, async (client) => {
    const session = await registerAdmin(client);

    const logout = await client.post("/api/auth/logout", {}, { token: session.token });
    assert.equal(logout.status, 200);

    const events = auditEvents(AUDIT_EVENT_TYPES.AUTH_LOGOUT);
    assert.equal(events.length, 1);
    assert.equal(events[0].result, "success");
    assert.equal(events[0].actor_user_id, session.user.id);
  });
});

test("role change logs oldRole and newRole", async () => {
  await withApp(app, async (client) => {
    const adminSession = await registerAdmin(client);
    const userSession = await registerSecondUser(client, "staff@example.com");

    const res = await client.patch(
      `/api/admin/users/${userSession.user.id}/role`,
      { role: "attorney" },
      { token: adminSession.token }
    );
    assert.equal(res.status, 200);

    const events = auditEvents(AUDIT_EVENT_TYPES.USER_ROLE_CHANGE);
    assert.equal(events.length, 1);
    assert.deepEqual(events[0].metadata_json, {
      oldRole: "user",
      newRole: "attorney",
    });
  });
});

test("payment status change logs oldStatus and newStatus without card data", async () => {
  await withApp(app, async (client) => {
    const adminSession = await registerAdmin(client);
    const leadId = randomUUID();
    const paymentId = randomUUID();

    store.payments.set(paymentId, {
      id: paymentId,
      lead_id: leadId,
      amount_min: 1000,
      amount_max: 2000,
      status: "pending_manual_processing",
      manual_review: true,
      notes: "card 4111111111111111",
      notes_redacted: false,
      billing_name: "Test",
      billing_email: "test@example.com",
      payment_preference: "invoice",
      consent_manual_processing: true,
      payment_method: "payment_link",
      hosted_payment_url: null,
      provider: "stripe",
      provider_reference: "ref_1",
      created_at: new Date(),
      updated_at: new Date(),
    });

    store.leads.set(leadId, {
      id: leadId,
      user_id: null,
      first_name: "A",
      last_name: "B",
      email: "lead@example.com",
      phone: "555",
      status: "new",
      deleted_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const res = await client.patch(
      `/api/admin/payments/${leadId}/status`,
      { status: "paid" },
      { token: adminSession.token }
    );
    assert.equal(res.status, 200);

    const events = auditEvents(AUDIT_EVENT_TYPES.PAYMENT_STATUS_CHANGE);
    assert.equal(events.length, 1);
    assert.equal(events[0].metadata_json.oldStatus, "pending_manual_processing");
    assert.equal(events[0].metadata_json.newStatus, "paid");
    assertNoSensitiveAuditPayload();
  });
});

test("admin sensitive lead read logs event", async () => {
  await withApp(app, async (client) => {
    const adminSession = await registerAdmin(client);
    const leadId = randomUUID();

    store.leads.set(leadId, {
      id: leadId,
      user_id: null,
      first_name: "Lead",
      last_name: "Owner",
      email: "lead@example.com",
      phone: "555",
      status: "new",
      deleted_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const res = await client.get(`/api/admin/leads/${leadId}`, {
      token: adminSession.token,
    });
    assert.equal(res.status, 200);

    const events = auditEvents(AUDIT_EVENT_TYPES.ADMIN_SENSITIVE_LEAD_READ);
    assert.equal(events.length, 1);
    assert.equal(events[0].metadata_json.sensitivity, "lead_detail");
  });
});

test("DSAR submit logs event without export payload", async () => {
  await withApp(app, async (client) => {
    await registerAdmin(client);
    const userSession = await registerSecondUser(client);

    const res = await client.post(
      "/api/account/dsar",
      { type: "export", message: "Please export my data" },
      { token: userSession.token }
    );
    assert.equal(res.status, 201);

    const events = auditEvents(AUDIT_EVENT_TYPES.DSAR_REQUEST_SUBMIT);
    assert.equal(events.length, 1);
    assert.equal(events[0].metadata_json.requestType, "access");
    assert.equal(events[0].metadata_json.export, undefined);
    assertNoSensitiveAuditPayload();
  });
});

test("normal user cannot read audit events admin endpoint", async () => {
  await withApp(app, async (client) => {
    await registerAdmin(client);
    const userSession = await registerSecondUser(client);

    const res = await client.get("/api/admin/audit-events", {
      token: userSession.token,
    });
    assert.equal(res.status, 403);
  });
});

test("admin can list audit events", async () => {
  await withApp(app, async (client) => {
    const adminSession = await registerAdmin(client);
    client.clearCookies();
    await client.post("/api/auth/login", {
      email: "admin@example.com",
      password: "longenough1",
    });

    const res = await client.get("/api/admin/audit-events", {
      token: adminSession.token,
    });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.events));
    assert.ok(res.body.events.length >= 1);
  });
});
