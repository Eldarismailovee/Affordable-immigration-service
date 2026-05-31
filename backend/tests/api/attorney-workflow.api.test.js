import { before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "crypto";
import { clearStore, setupTestEnvironment } from "../helpers/buildTestApp.js";
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

async function makeAdmin(client) {
  return registerAndLogin(client, { email: "admin@example.com" });
}

async function makeAttorney(client, adminSession) {
  const userSession = await registerAndLogin(client, { email: "attorney@example.com" });
  const userId = [...store.users.values()].find((u) => u.email === "attorney@example.com").id;

  const res = await client.patch(
    `/api/admin/users/${userId}/role`,
    { role: "attorney" },
    { token: adminSession.token }
  );
  assert.equal(res.status, 200);

  const login = await client.post("/api/auth/login", {
    email: "attorney@example.com",
    password: "longenough1",
  });
  assert.equal(login.status, 200);
  return login.body;
}

function seedDraftAgreement(leadId) {
  store.leads.set(leadId, {
    id: leadId,
    user_id: null,
    first_name: "Lead",
    last_name: "Owner",
    email: "lead@example.com",
    phone: "555",
    status: "attorney_review",
    deleted_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  });

  store.agreements.set(leadId, {
    id: randomUUID(),
    lead_id: leadId,
    title: "Agreement",
    html_content: "<p>Agreement</p>",
    status: "draft",
    generated_at: new Date(),
    approved_by: null,
    approved_at: null,
    review_notes: null,
    updated_at: new Date(),
  });
}

test("attorney role is accepted by user role validation", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client);
    const attorneySession = await makeAttorney(client, adminSession);

    assert.equal(attorneySession.user.role, "attorney");
  });
});

test("user cannot approve agreement packet", async () => {
  await withApp(app, async (client) => {
    await makeAdmin(client);
    const userSession = await registerAndLogin(client, { email: "client@example.com" });
    const leadId = randomUUID();
    seedDraftAgreement(leadId);

    const res = await client.patch(
      `/api/admin/agreement/${leadId}/approve`,
      {},
      { token: userSession.token }
    );
    assert.equal(res.status, 403);
    assert.equal(store.agreements.get(leadId).status, "draft");
  });
});

test("attorney can approve draft agreement packet", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client);
    const attorneySession = await makeAttorney(client, adminSession);
    const leadId = randomUUID();
    seedDraftAgreement(leadId);

    const res = await client.patch(
      `/api/admin/agreement/${leadId}/approve`,
      { reviewNotes: "Looks good" },
      { token: attorneySession.token }
    );
    assert.equal(res.status, 200);
    assert.equal(res.body.agreement.status, "approved");
    assert.equal(res.body.agreement.approved_by, attorneySession.user.id);
    assert.ok(res.body.agreement.approved_at);
  });
});

test("user cannot change lead state", async () => {
  await withApp(app, async (client) => {
    await makeAdmin(client);
    const userSession = await registerAndLogin(client, { email: "client@example.com" });
    const leadId = randomUUID();
    seedDraftAgreement(leadId);
    store.leads.get(leadId).status = "attorney_review";

    const res = await client.patch(
      `/api/admin/leads/${leadId}/state`,
      { state: "accepted" },
      { token: userSession.token }
    );
    assert.equal(res.status, 403);
    assert.equal(store.leads.get(leadId).status, "attorney_review");
  });
});

test("attorney can transition attorney_review to accepted", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client);
    const attorneySession = await makeAttorney(client, adminSession);
    const leadId = randomUUID();
    seedDraftAgreement(leadId);

    const res = await client.patch(
      `/api/admin/leads/${leadId}/state`,
      { state: "accepted" },
      { token: attorneySession.token }
    );
    assert.equal(res.status, 200);
    assert.equal(res.body.lead.status, "accepted");
  });
});

test("invalid lead state transition is rejected", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client);
    const leadId = randomUUID();
    seedDraftAgreement(leadId);
    store.leads.get(leadId).status = "prospective";

    const res = await client.patch(
      `/api/admin/leads/${leadId}/state`,
      { state: "accepted" },
      { token: adminSession.token }
    );
    assert.equal(res.status, 400);
    assert.equal(res.body.code, "INVALID_LEAD_STATE_TRANSITION");
  });
});

test("new agreement packet is draft by default", async () => {
  await withApp(app, async (client) => {
    const leadId = randomUUID();
    seedDraftAgreement(leadId);
    assert.equal(store.agreements.get(leadId).status, "draft");
  });
});
