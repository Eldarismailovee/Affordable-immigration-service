import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "crypto";
import { AppError } from "../../src/utils/appError.js";
import {
  assertAllowedCorrectionFields,
  assertIdentityVerified,
  assertNoLegalHold,
  normalizeRequestType,
  stripSecretsFromExportUser,
} from "../../src/utils/dsar.js";

const USER_ID = randomUUID();
const ADMIN = { id: randomUUID(), role: "admin", email: "admin@example.com" };
const REGULAR = { id: USER_ID, role: "user", email: "user@example.com" };
const OTHER = { id: randomUUID(), role: "user", email: "other@example.com" };

function dsarRow(overrides = {}) {
  return {
    id: randomUUID(),
    requester_user_id: USER_ID,
    requester_email: REGULAR.email,
    request_type: "export",
    status: "identity_verification_required",
    identity_verification_status: "pending",
    identity_verified_at: null,
    identity_verified_by: null,
    legal_hold: false,
    legal_hold_reason: null,
    legal_hold_applied_by: null,
    legal_hold_applied_at: null,
    admin_notes: null,
    user_message: "export please",
    requested_changes: null,
    export_payload_json: null,
    completed_at: null,
    completed_by: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

const defaultLeadRepoMocks = {
  anonymizeLeadsForUserId: async () => {},
  findLatestLeadByUserId: async () => null,
  updateLeadContactById: async () => null,
};

const defaultUserRepoMocks = {
  findUserByEmail: async () => null,
  findUserById: async () => null,
  updateUserFullNameById: async () => ({}),
  setUserProcessingRestriction: async () => ({}),
  setUserCcpaSaleOptOut: async () => ({}),
  anonymizeUserById: async () => ({}),
};

function defaultDsarRepoMocks() {
  return {
    createDsarRequest: async (payload) =>
      dsarRow({
        request_type: payload.requestType,
        status: payload.status,
        identity_verification_status: payload.identityVerificationStatus,
      }),
    findDsarRequestById: async () => null,
    listDsarRequestsByUserId: async () => [],
    listDsarRequestsForAccount: async () => [],
    listAllDsarRequests: async () => [],
    updateDsarRequest: async (id, fields) =>
      dsarRow({
        id,
        identity_verification_status:
          fields.identityVerificationStatus ?? "pending",
        status: fields.status ?? "submitted",
      }),
    appendAdminNotes: async (id) => dsarRow({ id }),
    createDsarEvent: async () => ({}),
    listDsarEventsByRequestId: async () => [],
  };
}

async function loadDsarService(t, mocks) {
  t.mock.module("../../src/repositories/dsar.repository.js", {
    namedExports: { ...defaultDsarRepoMocks(), ...mocks.dsarRepo },
  });
  if (mocks.exportRepo) {
    t.mock.module("../../src/repositories/dsar-export.repository.js", {
      namedExports: mocks.exportRepo,
    });
  }
  t.mock.module("../../src/repositories/user.repository.js", {
    namedExports: { ...defaultUserRepoMocks, ...mocks.userRepo },
  });
  t.mock.module("../../src/repositories/lead.repository.js", {
    namedExports: { ...defaultLeadRepoMocks, ...mocks.leadRepo },
  });
  t.mock.module("../../src/repositories/auth-token.repository.js", {
    namedExports: {
      revokeUserRefreshTokens: async () => {},
      RefreshTokenRotationError: class extends Error {},
    },
  });

  return import(`../../src/services/dsar.service.js?case=${Math.random()}`);
}

test("assertIdentityVerified throws when identity is not verified", () => {
  assert.throws(
    () => assertIdentityVerified(dsarRow({ identity_verification_status: "pending" })),
    (err) => {
      assert.equal(err.statusCode, 403);
      assert.match(err.message, /Identity verification/);
      return true;
    }
  );
});

test("assertNoLegalHold throws when legal hold is active", () => {
  assert.throws(
    () => assertNoLegalHold(dsarRow({ legal_hold: true })),
    (err) => {
      assert.equal(err.statusCode, 409);
      assert.match(err.message, /legal hold/i);
      return true;
    }
  );
});

test("stripSecretsFromExportUser omits password_hash", () => {
  const safe = stripSecretsFromExportUser({
    id: USER_ID,
    email: "user@example.com",
    full_name: "User",
    role: "user",
    status: "active",
    password_hash: "secret",
    created_at: new Date(),
    updated_at: new Date(),
  });

  assert.equal(safe.fullName, "User");
  assert.equal(safe.password_hash, undefined);
  assert.equal(safe.passwordHash, undefined);
});

test("user can create DSAR export request", async (t) => {
  let created;
  const { createUserDsarRequest } = await loadDsarService(t, {
    dsarRepo: {
      createDsarRequest: async (payload) => {
        created = payload;
        return dsarRow({
          request_type: payload.requestType,
          status: payload.status,
        });
      },
      createDsarEvent: async () => ({}),
    },
  });

  const request = await createUserDsarRequest({
    user: REGULAR,
    type: "access",
    message: "Please export my data",
  });

  assert.equal(created.requesterUserId, USER_ID);
  assert.equal(created.requestType, "access");
  assert.equal(request.type, "access");
  assert.equal(request.status, "identity_verification_required");
});

test("user can only view own DSAR request", async (t) => {
  const ownId = randomUUID();
  const { getUserDsarRequest } = await loadDsarService(t, {
    dsarRepo: {
      findDsarRequestById: async (id) =>
        dsarRow({
          id,
          requester_user_id: id === ownId ? USER_ID : OTHER.id,
        }),
    },
  });

  const own = await getUserDsarRequest({ user: REGULAR, requestId: ownId });
  assert.equal(own.id, ownId);

  await assert.rejects(
    getUserDsarRequest({ user: REGULAR, requestId: randomUUID() }),
    (err) => {
      assert.equal(err.statusCode, 403);
      return true;
    }
  );
});

test("export cannot be downloaded before identity verification", async (t) => {
  const requestId = randomUUID();
  const { getUserDsarExport } = await loadDsarService(t, {
    dsarRepo: {
      findDsarRequestById: async () =>
        dsarRow({
          id: requestId,
          identity_verification_status: "pending",
          export_payload_json: { generatedAt: new Date().toISOString(), user: {} },
        }),
    },
  });

  await assert.rejects(
    getUserDsarExport({ user: REGULAR, requestId }),
    (err) => {
      assert.equal(err.statusCode, 403);
      return true;
    }
  );
});

test("admin can mark identity verified", async (t) => {
  const requestId = randomUUID();
  const { verifyDsarIdentity } = await loadDsarService(t, {
    dsarRepo: {
      findDsarRequestById: async () => dsarRow({ id: requestId }),
      updateDsarRequest: async (id, fields) =>
        dsarRow({
          id,
          identity_verification_status: fields.identityVerificationStatus,
          status: fields.status ?? "identity_verified",
        }),
      appendAdminNotes: async () => dsarRow({ id: requestId }),
      listDsarEventsByRequestId: async () => [],
      createDsarEvent: async () => ({}),
    },
  });

  const result = await verifyDsarIdentity({
    actor: ADMIN,
    requestId,
    status: "verified",
    notes: "Verified via logged-in account",
  });

  assert.equal(result.identityVerificationStatus, "verified");
});

test("deletion/anonymization is blocked by legal hold", async (t) => {
  const requestId = randomUUID();
  const { applyDsarAnonymization } = await loadDsarService(t, {
    dsarRepo: {
      findDsarRequestById: async () =>
        dsarRow({
          id: requestId,
          request_type: "deletion",
          identity_verification_status: "verified",
          legal_hold: true,
        }),
    },
    userRepo: {
      anonymizeUserById: async () => {
        throw new Error("should not anonymize");
      },
    },
    leadRepo: {
      anonymizeLeadsForUserId: async () => {},
    },
  });

  await assert.rejects(
    applyDsarAnonymization({ actor: ADMIN, requestId }),
    (err) => {
      assert.equal(err.statusCode, 409);
      return true;
    }
  );
});

test("anonymization changes user PII via repository", async (t) => {
  const anonymized = {
    id: USER_ID,
    email: `anonymized+${USER_ID}@deleted.local`,
    full_name: "Deleted User",
    status: "disabled",
  };

  t.mock.module("../../src/repositories/lead.repository.js", {
    namedExports: { anonymizeLeadsForUserId: async () => {} },
  });
  t.mock.module("../../src/repositories/user.repository.js", {
    namedExports: { anonymizeUserById: async () => anonymized },
  });
  t.mock.module("../../src/repositories/auth-token.repository.js", {
    namedExports: { revokeUserRefreshTokens: async () => {} },
  });

  const { anonymizeUserRecord } = await import(
    `../../src/services/dsar-anonymization.service.js?case=${Math.random()}`
  );

  const result = await anonymizeUserRecord(USER_ID);
  assert.match(result.email, /anonymized\+/);
  assert.equal(result.full_name, "Deleted User");
});

test("restriction request marks processing restricted", async (t) => {
  const requestId = randomUUID();
  let restricted = false;

  const { applyDsarRestriction } = await loadDsarService(t, {
    dsarRepo: {
      findDsarRequestById: async () =>
        dsarRow({
          id: requestId,
          request_type: "restriction",
          identity_verification_status: "verified",
        }),
      updateDsarRequest: async () => dsarRow({ id: requestId, status: "completed" }),
      appendAdminNotes: async () => dsarRow({ id: requestId }),
      listDsarEventsByRequestId: async () => [],
      createDsarEvent: async () => ({}),
    },
    userRepo: {
      setUserProcessingRestriction: async ({ restricted: r }) => {
        restricted = r;
        return { id: USER_ID };
      },
    },
  });

  await applyDsarRestriction({
    actor: ADMIN,
    requestId,
    notes: "Restrict while reviewed",
  });

  assert.equal(restricted, true);
});

test("user cannot approve/process own request via admin service", async (t) => {
  const { verifyDsarIdentity } = await loadDsarService(t, {
    dsarRepo: {
      findDsarRequestById: async () => dsarRow(),
      updateDsarRequest: async () => dsarRow(),
      createDsarEvent: async () => ({}),
      listDsarEventsByRequestId: async () => [],
    },
  });

  await assert.rejects(
    verifyDsarIdentity({
      actor: REGULAR,
      requestId: randomUUID(),
      status: "verified",
    }),
    (err) => {
      assert.ok(err instanceof AppError || err.statusCode === 403);
      return true;
    }
  );
});

test("normalizeRequestType maps legacy export to access", () => {
  assert.equal(normalizeRequestType("export"), "access");
  assert.equal(normalizeRequestType("anonymization"), "deletion");
});

test("assertAllowedCorrectionFields rejects role changes", () => {
  assert.throws(
    () => assertAllowedCorrectionFields({ role: "admin" }),
    (err) => err.statusCode === 400
  );
});

test("buildUserDataExport omits password_hash", async (t) => {
  t.mock.module("../../src/repositories/dsar-export.repository.js", {
    namedExports: {
      findUserExportRow: async () => ({
        id: USER_ID,
        email: "user@example.com",
        full_name: "User",
        role: "user",
        status: "active",
        password_hash: "hidden",
        created_at: new Date(),
        updated_at: new Date(),
      }),
      listLeadsForUserExport: async () => [],
      listIntakesForUserLeads: async () => [],
      listAgreementsForUserLeads: async () => [],
      listOnboardingForUserLeads: async () => [],
      listBookingsForUserLeads: async () => [],
      listPaymentsForUserLeads: async () => [],
      listDocketwiseForUserLeads: async () => [],
      listDsarRequestsForUserExport: async () => [],
    },
  });

  const { buildUserDataExport } = await import(
    `../../src/services/dsar-export.service.js?case=${Math.random()}`
  );

  const payload = await buildUserDataExport(USER_ID);
  assert.equal(payload.user.fullName, "User");
  assert.equal(payload.user.password_hash, undefined);
});
