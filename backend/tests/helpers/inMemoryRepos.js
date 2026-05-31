import { randomUUID } from "crypto";
import { RefreshTokenRotationError } from "../../src/repositories/auth-token.repository.js";

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
    auditEvents: [],
    dsarRequests: new Map(),
    dsarEvents: [],
    cookieConsentLogs: [],
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
        processing_restricted_at: null,
        processing_restriction_reason: null,
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
    updateUserFullNameById: async (userId, fullName) => {
      const user = store.users.get(userId);
      if (!user) return null;
      user.full_name = fullName;
      return safeUser(user);
    },
    setUserProcessingRestriction: async ({ userId, reason, restricted }) => {
      const user = store.users.get(userId);
      if (!user) return null;
      user.processing_restricted_at = restricted ? new Date() : null;
      user.processing_restriction_reason = restricted ? reason : null;
      return safeUser(user);
    },
    anonymizeUserById: async (userId) => {
      const user = store.users.get(userId);
      if (!user) return null;
      user.email = `anonymized+${userId}@deleted.local`;
      user.full_name = "Deleted User";
      user.password_hash = "";
      user.status = "disabled";
      user.deleted_at = new Date();
      return user;
    },
    findUserByIdIncludingDeleted: async (id) => safeUser(store.users.get(id)),
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
      let currentRow = null;

      for (const row of store.refreshTokens.values()) {
        if (row.id === currentTokenId) {
          currentRow = row;
          break;
        }
      }

      if (!currentRow || currentRow.revoked_at) {
        throw new RefreshTokenRotationError();
      }

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
      currentRow.revoked_at = new Date();
      currentRow.replaced_by_token_id = nextTokenId;
      currentRow.last_used_at = new Date();
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
    listLeadSummaries: async ({ userId, attorneyVisibleOnly = false } = {}) => {
      const rows = [];
      for (const lead of store.leads.values()) {
        if (lead.deleted_at) continue;
        if (userId && lead.user_id !== userId) continue;
        if (attorneyVisibleOnly) {
          const visible = [
            "conflict_check",
            "attorney_review",
            "accepted",
            "declined",
            "filed",
          ];
          if (!visible.includes(lead.status)) continue;
        }
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
      lead.status = "declined";
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
    findLatestPaymentByLeadId: async (leadId) => {
      const payments = [...store.payments.values()].filter(
        (payment) => payment.lead_id === leadId
      );
      payments.sort((a, b) => b.created_at - a.created_at);
      return payments[0] || null;
    },
    updateIntakeAgreementStatusByLeadId: async () => {},
    updateIntakeDocketwiseStatusByLeadId: async () => {},
    findLatestDocketwiseSyncByLeadId: async () => null,
    updateLeadStateById: async (leadId, state) => {
      const lead = store.leads.get(leadId);
      if (!lead || lead.deleted_at) return null;
      lead.status = state;
      lead.updated_at = new Date();
      return lead;
    },
    updateLeadContactById: async ({ leadId, firstName, lastName, phone, email }) => {
      const lead = store.leads.get(leadId);
      if (!lead || lead.deleted_at) return null;
      if (firstName) lead.first_name = firstName;
      if (lastName) lead.last_name = lastName;
      if (phone) lead.phone = phone;
      if (email) lead.email = email;
      lead.updated_at = new Date();
      return lead;
    },
    anonymizeLeadsForUserId: async (userId) => {
      for (const lead of store.leads.values()) {
        if (lead.user_id === userId && !lead.deleted_at) {
          lead.first_name = "Deleted";
          lead.last_name = "User";
          lead.email = `anonymized+${lead.id}@deleted.local`;
          lead.phone = "0000000000";
        }
      }
    },
    findLatestLeadByUserId: async (userId) => {
      let latest = null;
      for (const lead of store.leads.values()) {
        if (lead.user_id === userId && !lead.deleted_at) {
          if (!latest || lead.created_at > latest.created_at) latest = lead;
        }
      }
      return latest;
    },
  };
}

export function buildDsarRepo(store) {
  if (!store.dsarRequests) store.dsarRequests = new Map();
  if (!store.dsarEvents) store.dsarEvents = [];

  return {
    createDsarRequest: async (payload) => {
      const id = randomUUID();
      const row = {
        id,
        requester_user_id: payload.requesterUserId,
        requester_email: payload.requesterEmail,
        request_type: payload.requestType,
        status: payload.status,
        identity_verification_status: payload.identityVerificationStatus,
        identity_verified_at: null,
        identity_verified_by: null,
        legal_hold: false,
        legal_hold_reason: null,
        legal_hold_applied_by: null,
        legal_hold_applied_at: null,
        admin_notes: null,
        user_message: payload.userMessage ?? null,
        requested_changes: payload.requestedChanges ?? null,
        export_payload_json: null,
        completed_at: null,
        completed_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      store.dsarRequests.set(id, row);
      return row;
    },
    findDsarRequestById: async (id) => store.dsarRequests.get(id) || null,
    listDsarRequestsByUserId: async (userId) =>
      [...store.dsarRequests.values()].filter((r) => r.requester_user_id === userId),
    listAllDsarRequests: async () => [...store.dsarRequests.values()],
    updateDsarRequest: async (id, fields) => {
      const row = store.dsarRequests.get(id);
      if (!row) return null;
      if (fields.status !== undefined) row.status = fields.status;
      if (fields.identityVerificationStatus !== undefined) {
        row.identity_verification_status = fields.identityVerificationStatus;
      }
      if (fields.identityVerifiedAt !== undefined) row.identity_verified_at = fields.identityVerifiedAt;
      if (fields.identityVerifiedBy !== undefined) row.identity_verified_by = fields.identityVerifiedBy;
      if (fields.legalHold !== undefined) row.legal_hold = fields.legalHold;
      if (fields.legalHoldReason !== undefined) row.legal_hold_reason = fields.legalHoldReason;
      if (fields.legalHoldAppliedBy !== undefined) row.legal_hold_applied_by = fields.legalHoldAppliedBy;
      if (fields.legalHoldAppliedAt !== undefined) row.legal_hold_applied_at = fields.legalHoldAppliedAt;
      if (fields.exportPayloadJson !== undefined) row.export_payload_json = fields.exportPayloadJson;
      if (fields.completedAt !== undefined) row.completed_at = fields.completedAt;
      if (fields.completedBy !== undefined) row.completed_by = fields.completedBy;
      row.updated_at = new Date();
      return row;
    },
    appendAdminNotes: async (id, note) => {
      const row = store.dsarRequests.get(id);
      if (!row) return null;
      row.admin_notes = row.admin_notes ? `${row.admin_notes}\n${note}` : note;
      return row;
    },
    createDsarEvent: async ({ dsarRequestId, actorUserId, eventType, metadata }) => {
      const row = {
        id: randomUUID(),
        dsar_request_id: dsarRequestId,
        actor_user_id: actorUserId ?? null,
        event_type: eventType,
        metadata_json: metadata ?? null,
        created_at: new Date(),
      };
      store.dsarEvents.push(row);
      return row;
    },
    listDsarEventsByRequestId: async (requestId) =>
      store.dsarEvents.filter((e) => e.dsar_request_id === requestId),
  };
}

export function buildDsarExportRepo(store) {
  return {
    findUserExportRow: async (userId) => {
      const user = store.users.get(userId);
      if (!user) return null;
      return { ...user };
    },
    listLeadsForUserExport: async (userId) =>
      [...store.leads.values()].filter((l) => l.user_id === userId),
    listIntakesForUserLeads: async () => [],
    listAgreementsForUserLeads: async () => [],
    listOnboardingForUserLeads: async () => [],
    listBookingsForUserLeads: async () => [],
    listPaymentsForUserLeads: async () => [],
    listDocketwiseForUserLeads: async () => [],
    listDsarRequestsForUserExport: async (userId) =>
      [...(store.dsarRequests?.values() || [])].filter((r) => r.requester_user_id === userId),
  };
}

export function buildAuditRepo(store) {
  return {
    createAdminAuditLog: async (entry) => {
      store.auditLog.push(entry);
    },
    insertAuditEvent: async (entry) => {
      store.auditEvents.push({
        id: entry.id,
        event_type: entry.eventType,
        category: entry.category,
        action: entry.action,
        result: entry.result,
        actor_user_id: entry.actorUserId,
        actor_role: entry.actorRole,
        target_type: entry.targetType,
        target_id: entry.targetId,
        request_id: entry.requestId,
        ip_hash: entry.ipHash,
        user_agent: entry.userAgent,
        reason_code: entry.reasonCode,
        metadata_json: entry.metadataJson,
        created_at: new Date(),
      });
    },
    listAuditEvents: async ({
      eventType,
      actorUserId,
      targetType,
      targetId,
      limit = 50,
    } = {}) => {
      let rows = [...store.auditEvents];

      if (eventType) {
        rows = rows.filter((row) => row.event_type === eventType);
      }
      if (actorUserId) {
        rows = rows.filter((row) => row.actor_user_id === actorUserId);
      }
      if (targetType) {
        rows = rows.filter((row) => row.target_type === targetType);
      }
      if (targetId) {
        rows = rows.filter((row) => row.target_id === targetId);
      }

      return rows
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, Math.min(limit, 200));
    },
  };
}

export function buildCookieConsentRepo(store) {
  return {
    createCookieConsentLog: async (entry) => {
      const row = {
        id: randomUUID(),
        user_id: entry.userId ?? null,
        anonymous_id: entry.anonymousId ?? null,
        consent_version: entry.consentVersion,
        strictly_necessary: entry.strictlyNecessary,
        analytics: entry.analytics,
        marketing: entry.marketing,
        source: entry.source,
        region_hint: entry.regionHint ?? null,
        user_agent_hash: entry.userAgentHash ?? null,
        ip_hash: entry.ipHash ?? null,
        created_at: new Date(),
      };
      store.cookieConsentLogs.push(row);
      return row;
    },
  };
}

export function buildAgreementRepo(store) {
  return {
    findLatestAgreementByLeadId: async (leadId) => store.agreements.get(leadId) || null,
    createAgreement: async ({ id, leadId, title, htmlContent, status = "draft" }) => {
      store.agreements.set(leadId, {
        id,
        lead_id: leadId,
        title,
        html_content: htmlContent,
        status,
        generated_at: new Date(),
        approved_by: null,
        approved_at: null,
        review_notes: null,
        updated_at: new Date(),
      });
    },
    approveAgreementByLeadId: async ({ leadId, approvedBy, reviewNotes }) => {
      const agreement = store.agreements.get(leadId);
      if (!agreement || agreement.status !== "draft") return null;
      agreement.status = "approved";
      agreement.approved_by = approvedBy;
      agreement.approved_at = new Date();
      agreement.review_notes = reviewNotes || null;
      agreement.updated_at = new Date();
      return agreement;
    },
  };
}

export function buildOnboardingRepo(store) {
  return {
    findLatestOnboardingPacketByLeadId: async (leadId) =>
      store.onboardingPackets.get(leadId) || null,
    createOnboardingPacket: async ({ id, leadId, title, htmlContent, status = "draft" }) => {
      store.onboardingPackets.set(leadId, {
        id,
        lead_id: leadId,
        title,
        html_content: htmlContent,
        status,
        generated_at: new Date(),
        approved_by: null,
        approved_at: null,
        review_notes: null,
        updated_at: new Date(),
      });
    },
    approveOnboardingPacketByLeadId: async ({ leadId, approvedBy, reviewNotes }) => {
      const packet = store.onboardingPackets.get(leadId);
      if (!packet || packet.status !== "draft") return null;
      packet.status = "approved";
      packet.approved_by = approvedBy;
      packet.approved_at = new Date();
      packet.review_notes = reviewNotes || null;
      packet.updated_at = new Date();
      return packet;
    },
  };
}

export function buildPaymentRepo(store) {
  return {
    createPaymentRecord: async (payload) => {
      const row = {
        id: payload.id,
        lead_id: payload.leadId,
        amount_min: payload.amountMin,
        amount_max: payload.amountMax,
        status: payload.status || "pending_manual_processing",
        manual_review: payload.manualReview ?? true,
        notes: payload.notes || "",
        notes_redacted: payload.notesRedacted ?? false,
        billing_name: payload.billingName,
        billing_email: payload.billingEmail,
        payment_preference: payload.paymentPreference,
        consent_manual_processing: Boolean(payload.consentManualProcessing),
        payment_method: payload.paymentMethod || "payment_link",
        hosted_payment_url: payload.hostedPaymentUrl || null,
        provider: payload.provider || null,
        provider_reference: payload.providerReference || null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      store.payments.set(row.id, row);
    },
    updatePaymentStatusByLeadId: async (leadId, status) => {
      for (const payment of store.payments.values()) {
        if (payment.lead_id === leadId) {
          payment.status = status;
          payment.updated_at = new Date();
          return { ...payment };
        }
      }
      return null;
    },
    updateHostedPaymentUrlByLeadId: async ({
      leadId,
      hostedPaymentUrl,
      provider,
      providerReference,
    }) => {
      for (const payment of store.payments.values()) {
        if (payment.lead_id === leadId) {
          payment.hosted_payment_url = hostedPaymentUrl;
          if (provider) payment.provider = provider;
          if (providerReference) payment.provider_reference = providerReference;
          payment.updated_at = new Date();
          return { ...payment };
        }
      }
      return null;
    },
    updateIntakePaymentStatusByLeadId: async () => {},
  };
}
