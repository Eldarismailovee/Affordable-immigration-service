import { randomUUID } from "crypto";
import { createHash, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

function hashToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

export function buildMfaRepo(store) {
  if (!store.mfaFactors) store.mfaFactors = new Map();
  if (!store.mfaRecoveryCodes) store.mfaRecoveryCodes = new Map();
  if (!store.mfaChallenges) store.mfaChallenges = new Map();

  return {
    findActiveTotpFactorByUserId: async (userId) => {
      for (const factor of store.mfaFactors.values()) {
        if (
          factor.user_id === userId &&
          factor.type === "totp" &&
          factor.status === "active"
        ) {
          return factor;
        }
      }
      return null;
    },
    findPendingTotpFactorByUserId: async (userId) => {
      for (const factor of store.mfaFactors.values()) {
        if (
          factor.user_id === userId &&
          factor.type === "totp" &&
          factor.status === "pending"
        ) {
          return factor;
        }
      }
      return null;
    },
    invalidatePendingTotpFactors: async (userId) => {
      for (const factor of store.mfaFactors.values()) {
        if (factor.user_id === userId && factor.status === "pending") {
          factor.status = "disabled";
          factor.disabled_at = new Date();
        }
      }
    },
    createPendingTotpFactor: async ({
      id,
      userId,
      encryptedSecret,
      encryptionNonce,
      keyVersion,
    }) => {
      const row = {
        id,
        user_id: userId,
        type: "totp",
        encrypted_secret: encryptedSecret,
        encryption_nonce: encryptionNonce,
        key_version: keyVersion,
        status: "pending",
        enrolled_at: null,
        verified_at: null,
        disabled_at: null,
        last_used_timestep: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      store.mfaFactors.set(id, row);
      return row;
    },
    activateTotpFactor: async ({ factorId, userId, timestep }) => {
      for (const factor of store.mfaFactors.values()) {
        if (
          factor.user_id === userId &&
          factor.status === "active" &&
          factor.id !== factorId
        ) {
          factor.status = "disabled";
        }
      }

      const factor = store.mfaFactors.get(factorId);
      if (!factor || factor.user_id !== userId || factor.status !== "pending") {
        return null;
      }

      factor.status = "active";
      factor.enrolled_at = new Date();
      factor.verified_at = new Date();
      factor.last_used_timestep = timestep;
      return factor;
    },
    disableActiveTotpFactor: async (userId) => {
      for (const factor of store.mfaFactors.values()) {
        if (factor.user_id === userId && factor.status === "active") {
          factor.status = "disabled";
          factor.disabled_at = new Date();
          return factor;
        }
      }
      return null;
    },
    resetUserMfaFactors: async (userId) => {
      for (const factor of store.mfaFactors.values()) {
        if (factor.user_id === userId && ["active", "pending"].includes(factor.status)) {
          factor.status = "disabled";
          factor.disabled_at = new Date();
        }
      }
    },
    consumeTotpTimestep: async ({ factorId, userId, timestep, previousTimestep }) => {
      const factor = store.mfaFactors.get(factorId);
      if (!factor || factor.user_id !== userId || factor.status !== "active") {
        return null;
      }

      if (
        factor.last_used_timestep !== null &&
        factor.last_used_timestep !== previousTimestep
      ) {
        return null;
      }

      if (factor.last_used_timestep !== null && factor.last_used_timestep >= timestep) {
        return null;
      }

      factor.last_used_timestep = timestep;
      return factor;
    },
    insertRecoveryCodes: async ({ userId, codes }) => {
      for (const entry of codes) {
        store.mfaRecoveryCodes.set(entry.id, {
          id: entry.id,
          user_id: userId,
          code_hash: entry.codeHash,
          used_at: null,
          created_at: new Date(),
        });
      }
    },
    deleteRecoveryCodesByUserId: async (userId) => {
      for (const [id, row] of store.mfaRecoveryCodes.entries()) {
        if (row.user_id === userId) {
          store.mfaRecoveryCodes.delete(id);
        }
      }
    },
    consumeRecoveryCode: async ({ userId, codeHash }) => {
      for (const row of store.mfaRecoveryCodes.values()) {
        if (row.user_id === userId && row.code_hash === codeHash && !row.used_at) {
          row.used_at = new Date();
          return row;
        }
      }
      return null;
    },
    listUnusedRecoveryCodeHashes: async (userId) =>
      [...store.mfaRecoveryCodes.values()]
        .filter((row) => row.user_id === userId && !row.used_at)
        .map((row) => row.code_hash),
    verifyAndConsumeRecoveryCode: async (userId, normalizedCode) => {
      for (const row of store.mfaRecoveryCodes.values()) {
        if (row.user_id !== userId || row.used_at) continue;
        const [algorithm, salt, storedKey] = String(row.code_hash).split(":");
        if (algorithm !== "scrypt") continue;
        const key = await scryptAsync(normalizedCode, salt, 32);
        const storedBuffer = Buffer.from(storedKey, "hex");
        if (
          storedBuffer.length === key.length &&
          timingSafeEqual(storedBuffer, key)
        ) {
          row.used_at = new Date();
          return true;
        }
      }
      return false;
    },
    countUnusedRecoveryCodes: async (userId) => {
      let total = 0;
      for (const row of store.mfaRecoveryCodes.values()) {
        if (row.user_id === userId && !row.used_at) total += 1;
      }
      return total;
    },
    hasActiveMfa: async (userId) => {
      for (const factor of store.mfaFactors.values()) {
        if (
          factor.user_id === userId &&
          factor.type === "totp" &&
          factor.status === "active"
        ) {
          return true;
        }
      }
      return false;
    },
    activateEnrollmentTransaction: async ({ factorId, userId, timestep, recoveryCodes }) => {
      const factor = await buildMfaRepo(store).activateTotpFactor({
        factorId,
        userId,
        timestep,
      });
      if (!factor) return null;
      await buildMfaRepo(store).deleteRecoveryCodesByUserId(userId);
      await buildMfaRepo(store).insertRecoveryCodes({ userId, codes: recoveryCodes });
      return factor;
    },
  };
}

export function buildMfaChallengeRepo(store) {
  if (!store.mfaChallenges) store.mfaChallenges = new Map();

  return {
    createMfaChallenge: async ({ id, userId, purpose, tokenHash, expiresAt }) => {
      const row = {
        id,
        user_id: userId,
        purpose,
        token_hash: tokenHash,
        attempts: 0,
        expires_at: expiresAt,
        consumed_at: null,
        created_at: new Date(),
      };
      store.mfaChallenges.set(tokenHash, row);
      return row;
    },
    findMfaChallengeByTokenHash: async (tokenHash) =>
      store.mfaChallenges.get(tokenHash) || null,
    incrementMfaChallengeAttempts: async (challengeId) => {
      for (const row of store.mfaChallenges.values()) {
        if (row.id === challengeId) {
          row.attempts += 1;
          return row;
        }
      }
      return null;
    },
    consumeMfaChallenge: async (challengeId) => {
      for (const row of store.mfaChallenges.values()) {
        if (row.id === challengeId && !row.consumed_at && row.expires_at > new Date()) {
          row.consumed_at = new Date();
          return row;
        }
      }
      return null;
    },
    invalidateMfaChallenge: async (challengeId) => {
      for (const row of store.mfaChallenges.values()) {
        if (row.id === challengeId) {
          row.consumed_at = row.consumed_at || new Date();
          return row;
        }
      }
      return null;
    },
    invalidateUserMfaChallenges: async (userId) => {
      for (const row of store.mfaChallenges.values()) {
        if (row.user_id === userId && !row.consumed_at) {
          row.consumed_at = new Date();
        }
      }
    },
  };
}
