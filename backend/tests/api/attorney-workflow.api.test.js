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

function seedLeadForWorkflow(leadId, status = "attorney_review") {
  store.leads.set(leadId, {
    id: leadId,
    user_id: null,
    first_name: "Lead",
    last_name: "Owner",
    email: "lead@example.com",
    phone: "555",
    status,
    attorney_review_status: status === "accepted" ? "accepted" : null,
    attorney_reviewed_by: null,
    attorney_reviewed_at: null,
    attorney_review_notes: null,
    responsible_attorney_confirmed: status === "accepted",
    deleted_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  });

  store.intakes.set(leadId, {
    id: randomUUID(),
    lead_id: leadId,
    selected_package: "filing",
    case_type: "Marriage-based green cards",
    notes: "",
    agreement_status: "previewed",
    legal_recommendation_approved_by: null,
    legal_recommendation_approved_at: null,
    created_at: new Date(),
  });

  store.conflictChecks.set(leadId, {
    id: randomUUID(),
    lead_id: leadId,
    potential_client_name: "Lead Owner",
    potential_client_email: "lead@example.com",
    opposing_party_names: [],
    related_person_names: [],
    case_summary: "Summary",
    matter_type: "Marriage-based green cards",
    jurisdiction_or_location: "California",
    notes: null,
    result: "clear",
    submitted_at: new Date(),
    reviewed_by: null,
    reviewed_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  });
}

function seedDraftAgreement(leadId) {
  seedLeadForWorkflow(leadId, "attorney_review");
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
  });
});

test("user cannot change lead state", async () => {
  await withApp(app, async (client) => {
    await makeAdmin(client);
    const userSession = await registerAndLogin(client, { email: "client@example.com" });
    const leadId = randomUUID();
    seedDraftAgreement(leadId);

    const res = await client.patch(
      `/api/admin/leads/${leadId}/state`,
      { state: "accepted" },
      { token: userSession.token }
    );
    assert.equal(res.status, 403);
    assert.equal(store.leads.get(leadId).status, "attorney_review");
  });
});

test("attorney can transition conflict_check to attorney_review when conflict check is clear", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client);
    const attorneySession = await makeAttorney(client, adminSession);
    const leadId = randomUUID();
    seedLeadForWorkflow(leadId, "conflict_check");

    const res = await client.patch(
      `/api/admin/leads/${leadId}/state`,
      { state: "attorney_review" },
      { token: attorneySession.token }
    );
    assert.equal(res.status, 200);
    assert.equal(res.body.lead.status, "attorney_review");
  });
});

test("lead cannot move to accepted without attorney review acceptance", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client);
    const leadId = randomUUID();
    seedLeadForWorkflow(leadId, "attorney_review");
    store.leads.get(leadId).attorney_review_status = null;

    const res = await client.patch(
      `/api/admin/leads/${leadId}/state`,
      { state: "accepted" },
      { token: adminSession.token }
    );
    assert.equal(res.status, 400);
    assert.equal(res.body.code, "ATTORNEY_REVIEW_NOT_ACCEPTED");
  });
});

test("invalid lead state transition is rejected", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client);
    const leadId = randomUUID();
    seedDraftAgreement(leadId);
    store.leads.get(leadId).status = "new";

    const res = await client.patch(
      `/api/admin/leads/${leadId}/state`,
      { state: "accepted" },
      { token: adminSession.token }
    );
    assert.equal(res.status, 400);
    assert.equal(res.body.code, "INVALID_LEAD_STATE_TRANSITION");
  });
});

test("agreement generation is blocked before attorney review acceptance", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client);
    const leadId = randomUUID();
    seedLeadForWorkflow(leadId, "new");

    const res = await client.post(`/api/admin/agreement/${leadId}/generate`, {}, {
      token: adminSession.token,
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.code, "LEAD_STATUS_BLOCKS_AGREEMENT");
  });
});

test("filing packet generation is blocked before engaged status", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client);
    const leadId = randomUUID();
    seedLeadForWorkflow(leadId, "accepted");

    const res = await client.post(`/api/admin/onboarding/${leadId}/generate`, {}, {
      token: adminSession.token,
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.code, "LEAD_STATUS_BLOCKS_FILING_PACKET");
  });
});

test("public responsible attorney endpoint returns non-fake profile", async () => {
  await withApp(app, async (client) => {
    const res = await client.get("/api/public/responsible-attorney");
    assert.equal(res.status, 200);
    assert.equal(res.body.responsibleAttorney.configured, false);
    assert.equal(res.body.responsibleAttorney.pendingVerification, true);
    assert.match(res.body.responsibleAttorney.publicText, /engagement materials/i);
    assert.equal(res.body.responsibleAttorney.name, null);
  });
});
