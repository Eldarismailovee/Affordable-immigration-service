import { randomUUID } from "crypto";

export function createInMemoryStore() {
  return {
    users: new Map(),
    leads: new Map(),
    intakes: new Map(),
    bookings: new Map(),
    payments: new Map(),
    onboardingPackets: new Map(),
    agreements: new Map(),
    docketwiseSync: new Map(),
    refreshTokens: new Map(),
    emailVerificationTokens: new Map(),
    passwordResetTokens: new Map(),
    auditLog: [],
  };
}

function safeUser(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  void password_hash;
  return rest;
}

export function buildUserRepo(store) {
  return {
    findUserByEmail: async (email) => {
      for (const user of store.users.values()) {
        if (user.email.toLowerCase() === String(email).toLowerCase()) {
          return user;
        }
      }
      return null;
    },
    findUserById: async (id) => safeUser(store.users.get(id)),
    countUsers: async () => store.users.size,
    countActiveAdmins: async () => {
      let total = 0;
      for (const user of store.users.values()) {
        if (user.role === "admin" && user.status === "active") total += 1;
      }
      return total;
    },
    createUser: async ({ email, passwordHash, fullName, role }) => {
      const id = randomUUID();
      const row = {
        id,
        email: String(email).toLowerCase(),
        password_hash: passwordHash,
        full_name: fullName,
        role,
        status: "active",
        email_verified_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      store.users.set(id, row);
      return safeUser(row);
    },
    listUsers: async () => Array.from(store.users.values()).map(safeUser),
    updateUserRoleById: async (userId, role) => {
      const user = store.users.get(userId);
      if (!user) return null;
      user.role = role;
      user.updated_at = new Date();
      return safeUser(user);
    },
    updateUserPasswordById: async (userId, passwordHash) => {
      const user = store.users.get(userId);
      if (!user) return null;
      user.password_hash = passwordHash;
      user.updated_at = new Date();
      return safeUser(user);
    },
    markUserEmailVerifiedById: async (userId) => {
      const user = store.users.get(userId);
      if (!user) return null;
      user.email_verified_at = user.email_verified_at || new Date();
      return safeUser(user);
    },
    softDeleteUserById: async (userId) => {
      const user = store.users.get(userId);
      if (!user) return null;
      user.status = "disabled";
      return safeUser(user);
    },
  };
}

export function buildAuthTokenRepo(store) {
  return {
    createRefreshToken: async ({ id, userId, tokenHash, expiresAt }) => {
      const row = {
        id,
        user_id: userId,
        token_hash: tokenHash,
        revoked_at: null,
        replaced_by_token_id: null,
        user_agent: "",
        ip_address: "",
        last_used_at: null,
        expires_at: expiresAt,
        created_at: new Date(),
      };
      store.refreshTokens.set(tokenHash, row);
      return row;
    },
    findRefreshTokenByHash: async (tokenHash) =>
      store.refreshTokens.get(tokenHash) || null,
    revokeRefreshTokenByHash: async (tokenHash) => {
      const row = store.refreshTokens.get(tokenHash);
      if (!row) return null;
      row.revoked_at = row.revoked_at || new Date();
      return row;
    },
    revokeUserRefreshTokens: async (userId) => {
      for (const row of store.refreshTokens.values()) {
        if (row.user_id === userId && !row.revoked_at) {
          row.revoked_at = new Date();
        }
      }
    },
    rotateRefreshToken: async ({
      currentTokenId,
      nextTokenId,
      userId,
      tokenHash,
      expiresAt,
    }) => {
      const next = {
        id: nextTokenId,
        user_id: userId,
        token_hash: tokenHash,
        revoked_at: null,
        replaced_by_token_id: null,
        expires_at: expiresAt,
        created_at: new Date(),
      };
      store.refreshTokens.set(tokenHash, next);
      for (const row of store.refreshTokens.values()) {
        if (row.id === currentTokenId) {
          row.revoked_at = new Date();
          row.replaced_by_token_id = nextTokenId;
          row.last_used_at = new Date();
        }
      }
      return next;
    },
    createEmailVerificationToken: async ({ id, userId, tokenHash, expiresAt }) => {
      const row = {
        id,
        user_id: userId,
        token_hash: tokenHash,
        consumed_at: null,
        expires_at: expiresAt,
        created_at: new Date(),
      };
      store.emailVerificationTokens.set(tokenHash, row);
      return row;
    },
    consumeEmailVerificationToken: async (tokenHash) => {
      const row = store.emailVerificationTokens.get(tokenHash);
      if (!row || row.consumed_at || new Date(row.expires_at) <= new Date()) {
        return null;
      }
      row.consumed_at = new Date();
      return row;
    },
    createPasswordResetToken: async ({ id, userId, tokenHash, expiresAt }) => {
      const row = {
        id,
        user_id: userId,
        token_hash: tokenHash,
        consumed_at: null,
        expires_at: expiresAt,
        created_at: new Date(),
      };
      store.passwordResetTokens.set(tokenHash, row);
      return row;
    },
    consumePasswordResetToken: async (tokenHash) => {
      const row = store.passwordResetTokens.get(tokenHash);
      if (!row || row.consumed_at || new Date(row.expires_at) <= new Date()) {
        return null;
      }
      row.consumed_at = new Date();
      return row;
    },
  };
}

export function buildLeadRepo(store) {
  return {
    listLeadSummaries: async ({ userId } = {}) => {
      const rows = [];
      for (const lead of store.leads.values()) {
        if (lead.deleted_at) continue;
        if (userId && lead.user_id !== userId) continue;
        rows.push({
          id: lead.id,
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email,
          phone: lead.phone,
          status: lead.status,
          created_at: lead.created_at,
          selected_package: null,
          case_type: null,
          agreement_status: null,
          booking_status: null,
          payment_status: null,
          docketwise_status: null,
          docketwise_external_id: null,
          pricing_min: null,
          pricing_max: null,
          onboarding_status: null,
          agreement_document_status: null,
        });
      }
      return rows;
    },
    findLeadById: async (id) => {
      const lead = store.leads.get(id);
      return lead && !lead.deleted_at ? lead : null;
    },
    softDeleteLeadById: async (id) => {
      const lead = store.leads.get(id);
      if (!lead || lead.deleted_at) return null;
      lead.status = "closed";
      lead.deleted_at = new Date();
      lead.updated_at = new Date();
      return lead;
    },
    createLead: async ({ id, userId, firstName, lastName, email, phone, status }) => {
      const row = {
        id,
        user_id: userId || null,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        status,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      store.leads.set(id, row);
      return row;
    },
    createIntakeRecord: async () => {},
    createBookingRecord: async () => {},
    findLatestIntakeByLeadId: async () => null,
    findLatestBookingByLeadId: async () => null,
    findLatestPaymentByLeadId: async () => null,
    updateIntakeAgreementStatusByLeadId: async () => {},
    updateIntakeDocketwiseStatusByLeadId: async () => {},
    findLatestDocketwiseSyncByLeadId: async () => null,
  };
}

export function buildAuditRepo(store) {
  return {
    createAdminAuditLog: async (entry) => {
      store.auditLog.push(entry);
    },
  };
}

export function buildAgreementRepo() {
  return {
    findLatestAgreementByLeadId: async () => null,
    createAgreement: async () => {},
  };
}

export function buildOnboardingRepo() {
  return {
    findLatestOnboardingPacketByLeadId: async () => null,
    createOnboardingPacket: async () => {},
  };
}
