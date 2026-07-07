import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";
import mfaConfig, { decryptTotpSecret, encryptTotpSecret } from "../config/mfa.js";
import {
  AUDIT_CATEGORIES,
  AUDIT_EVENT_TYPES,
  AUDIT_RESULTS,
} from "../constants/audit.js";
import {
  MFA_CHALLENGE_PURPOSE,
  MFA_ERROR_CODES,
  MFA_AUDIT_REASONS,
  MFA_RECOVERY_CODE_COUNT,
  MFA_RECOVERY_CODE_SEGMENTS,
  MFA_RECOVERY_CODE_SEGMENT_LENGTH,
  isPrivilegedRole,
} from "../constants/mfa.js";
import {
  consumeMfaChallenge,
  createMfaChallenge,
  findMfaChallengeByTokenHash,
  incrementMfaChallengeAttempts,
  invalidateMfaChallenge,
  invalidateUserMfaChallenges,
} from "../repositories/mfa-challenge.repository.js";
import {
  activateEnrollmentTransaction,
  countUnusedRecoveryCodes,
  disableActiveTotpFactor,
  findActiveTotpFactorByUserId,
  findPendingTotpFactorByUserId,
  hasActiveMfa,
  invalidatePendingTotpFactors,
  createPendingTotpFactor,
  deleteRecoveryCodesByUserId,
  insertRecoveryCodes,
  resetUserMfaFactors,
  consumeTotpTimestep,
  verifyAndConsumeRecoveryCode,
} from "../repositories/mfa.repository.js";
import { revokeUserRefreshTokens } from "../repositories/auth-token.repository.js";
import {
  bumpSessionSecurityVersion,
  findUserByEmail,
  findUserById,
  getSessionSecurityVersion,
} from "../repositories/user.repository.js";
import { createAuthSession } from "./session.service.js";
import { recordAuditEvent } from "./audit.service.js";
import { AppError } from "../utils/appError.js";
import {
  addSeconds,
  createOpaqueToken,
  hashToken,
  sanitizeUser,
  verifyPassword,
} from "../utils/auth.js";
import { buildActor } from "../utils/auditContext.js";

const scryptAsync = promisify(scrypt);
const RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function mfaError(message, statusCode, code) {
  return new AppError(message, statusCode, code);
}

function invalidMfaCodeError() {
  return mfaError("Invalid verification code", 401, MFA_ERROR_CODES.MFA_INVALID);
}

function invalidRecoveryCodeError() {
  return mfaError("Invalid recovery code", 401, MFA_ERROR_CODES.RECOVERY_CODE_INVALID);
}

function challengeInvalidError() {
  return mfaError("Invalid MFA challenge", 401, MFA_ERROR_CODES.MFA_CHALLENGE_INVALID);
}

function challengeExpiredError() {
  return mfaError("MFA challenge expired", 401, MFA_ERROR_CODES.MFA_CHALLENGE_EXPIRED);
}

function challengeConsumedError() {
  return mfaError("MFA challenge already used", 401, MFA_ERROR_CODES.MFA_CHALLENGE_CONSUMED);
}

function replayDetectedError() {
  return mfaError("Verification code already used", 401, MFA_ERROR_CODES.MFA_REPLAY_DETECTED);
}

function enrollmentRequiredError() {
  return mfaError(
    "MFA enrollment is required for this account",
    403,
    MFA_ERROR_CODES.MFA_ENROLLMENT_REQUIRED
  );
}

function stepUpRequiredError() {
  return mfaError(
    "Recent MFA verification is required for this action",
    403,
    MFA_ERROR_CODES.STEP_UP_REQUIRED
  );
}

function getTotpTimestep() {
  return Math.floor(Date.now() / 1000 / mfaConfig.totpPeriod);
}

async function hashRecoveryCode(code) {
  const salt = randomBytes(16).toString("hex");
  const key = await scryptAsync(code, salt, 32);
  return `scrypt:${salt}:${key.toString("hex")}`;
}

async function verifyRecoveryCodeHash(code, storedHash) {
  const [algorithm, salt, storedKey] = String(storedHash || "").split(":");

  if (algorithm !== "scrypt" || !salt || !storedKey) {
    return false;
  }

  const key = await scryptAsync(code, salt, 32);
  const storedBuffer = Buffer.from(storedKey, "hex");

  if (storedBuffer.length !== key.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, key);
}

function normalizeRecoveryCode(code) {
  return String(code || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function generateRecoveryCodePlaintext() {
  const bytes = randomBytes(
    MFA_RECOVERY_CODE_SEGMENTS * MFA_RECOVERY_CODE_SEGMENT_LENGTH
  );
  let raw = "";

  for (let index = 0; index < bytes.length; index += 1) {
    raw += RECOVERY_ALPHABET[bytes[index] % RECOVERY_ALPHABET.length];
  }

  const segments = [];

  for (let segment = 0; segment < MFA_RECOVERY_CODE_SEGMENTS; segment += 1) {
    const start = segment * MFA_RECOVERY_CODE_SEGMENT_LENGTH;
    segments.push(
      raw.slice(start, start + MFA_RECOVERY_CODE_SEGMENT_LENGTH)
    );
  }

  return segments.join("-");
}

async function buildRecoveryCodeRecords() {
  const codes = [];

  for (let index = 0; index < MFA_RECOVERY_CODE_COUNT; index += 1) {
    const plaintext = generateRecoveryCodePlaintext();
    codes.push({
      id: randomUUID(),
      plaintext,
      codeHash: await hashRecoveryCode(normalizeRecoveryCode(plaintext)),
    });
  }

  return codes;
}

export async function createLoginMfaChallenge(user, purpose, requestContext) {
  await invalidateUserMfaChallenges(user.id);

  const challengeToken = createOpaqueToken();
  const challengeId = randomUUID();

  await createMfaChallenge({
    id: challengeId,
    userId: user.id,
    purpose,
    tokenHash: hashToken(challengeToken),
    expiresAt: addSeconds(new Date(), mfaConfig.challengeTtlSeconds),
  });

  return {
    mfaChallengeToken: challengeToken,
    expiresIn: mfaConfig.challengeTtlSeconds,
    purpose,
    user: sanitizeUser(user),
  };
}

export async function resolveMfaChallenge(challengeToken, { expectedPurpose, expectedUserId } = {}) {
  const challenge = await findMfaChallengeByTokenHash(hashToken(challengeToken));

  if (!challenge) {
    throw challengeInvalidError();
  }

  if (expectedUserId && challenge.user_id !== expectedUserId) {
    throw challengeInvalidError();
  }

  if (expectedPurpose && challenge.purpose !== expectedPurpose) {
    throw challengeInvalidError();
  }

  if (challenge.consumed_at) {
    throw challengeConsumedError();
  }

  if (new Date(challenge.expires_at) <= new Date()) {
    throw challengeExpiredError();
  }

  if (challenge.attempts >= mfaConfig.maxAttempts) {
    await invalidateMfaChallenge(challenge.id);
    throw challengeInvalidError();
  }

  return challenge;
}

async function auditMfaEvent({
  eventType,
  action,
  result,
  actor,
  targetId,
  requestContext,
  reasonCode = null,
  metadata = {},
}) {
  await recordAuditEvent({
    eventType,
    category: AUDIT_CATEGORIES.AUTH,
    action,
    result,
    ...(actor ? buildActor(actor) : {}),
    targetType: "user",
    targetId,
    request: requestContext,
    reasonCode,
    metadata,
  });
}

async function verifyTotpCode(secret, code, { afterTimeStep } = {}) {
  const normalizedCode = String(code || "").replace(/\s/g, "");

  return verify({
    secret,
    token: normalizedCode,
    epochTolerance: mfaConfig.totpEpochTolerance,
    ...(afterTimeStep !== undefined && afterTimeStep !== null
      ? { afterTimeStep }
      : {}),
  });
}

async function verifyTotpForFactor(factor, code) {
  const secret = decryptTotpSecret(factor.encrypted_secret, factor.encryption_nonce);
  const isValid = await verifyTotpCode(secret, code, {
    afterTimeStep: factor.last_used_timestep ?? undefined,
  });

  if (!isValid) {
    return { ok: false, replay: false, timestep: null };
  }

  const timestep = getTotpTimestep();
  const consumed = await consumeTotpTimestep({
    factorId: factor.id,
    userId: factor.user_id,
    timestep,
    previousTimestep: factor.last_used_timestep,
  });

  if (!consumed) {
    return { ok: false, replay: true, timestep };
  }

  return { ok: true, replay: false, timestep };
}

async function verifyTotpForPendingFactor(factor, code) {
  const secret = decryptTotpSecret(factor.encrypted_secret, factor.encryption_nonce);
  const isValid = await verifyTotpCode(secret, code);

  if (!isValid) {
    return { ok: false, replay: false, timestep: null };
  }

  return { ok: true, replay: false, timestep: getTotpTimestep() };
}

export async function verifyMfaLogin({
  challengeToken,
  code,
  recoveryCode,
  requestContext,
}) {
  const challenge = await resolveMfaChallenge(challengeToken, {
    expectedPurpose: MFA_CHALLENGE_PURPOSE.LOGIN,
  });

  const userRow = await findUserById(challenge.user_id);

  if (!userRow) {
    throw challengeInvalidError();
  }

  const user = sanitizeUser(userRow);
  let verified = false;
  let usedRecovery = false;

  try {
    if (recoveryCode) {
      const normalized = normalizeRecoveryCode(recoveryCode);
      verified = await verifyAndConsumeRecoveryCode(user.id, normalized);

      if (!verified) {
        await incrementMfaChallengeAttempts(challenge.id);
        await auditMfaEvent({
          eventType: AUDIT_EVENT_TYPES.MFA_VERIFICATION_FAILED,
          action: "mfa_verify",
          result: AUDIT_RESULTS.FAILURE,
          actor: user,
          targetId: user.id,
          requestContext,
          reasonCode: MFA_AUDIT_REASONS.INVALID_CODE,
        });
        throw invalidRecoveryCodeError();
      }

      usedRecovery = true;
    } else {
      const factor = await findActiveTotpFactorByUserId(user.id);

      if (!factor) {
        throw enrollmentRequiredError();
      }

      const result = await verifyTotpForFactor(factor, code);

      if (!result.ok) {
        await incrementMfaChallengeAttempts(challenge.id);

        await auditMfaEvent({
          eventType: AUDIT_EVENT_TYPES.MFA_VERIFICATION_FAILED,
          action: "mfa_verify",
          result: AUDIT_RESULTS.FAILURE,
          actor: user,
          targetId: user.id,
          requestContext,
          reasonCode: result.replay
            ? MFA_AUDIT_REASONS.REPLAY
            : MFA_AUDIT_REASONS.INVALID_CODE,
        });

        if (result.replay) {
          throw replayDetectedError();
        }

        throw invalidMfaCodeError();
      }

      verified = true;
    }

    const consumedChallenge = await consumeMfaChallenge(challenge.id);

    if (!consumedChallenge) {
      throw challengeConsumedError();
    }

    const sessionSecurityVersion = await getSessionSecurityVersion(user.id);
    const session = await createAuthSession(user, requestContext, {
      mfaCompleted: true,
      sessionSecurityVersion,
    });

    await auditMfaEvent({
      eventType: usedRecovery
        ? AUDIT_EVENT_TYPES.MFA_RECOVERY_CODE_USED
        : AUDIT_EVENT_TYPES.MFA_VERIFICATION_SUCCESS,
      action: usedRecovery ? "recovery_code_used" : "mfa_verify",
      result: AUDIT_RESULTS.SUCCESS,
      actor: user,
      targetId: user.id,
      requestContext,
    });

    return session;
  } catch (error) {
    if (
      error instanceof AppError &&
      [MFA_ERROR_CODES.MFA_INVALID, MFA_ERROR_CODES.RECOVERY_CODE_INVALID].includes(error.code)
    ) {
      const updated = await incrementMfaChallengeAttempts(challenge.id);

      if (updated && updated.attempts >= mfaConfig.maxAttempts) {
        await invalidateMfaChallenge(challenge.id);
        await auditMfaEvent({
          eventType: AUDIT_EVENT_TYPES.MFA_CHALLENGE_RATE_LIMITED,
          action: "mfa_verify",
          result: AUDIT_RESULTS.FAILURE,
          actor: user,
          targetId: user.id,
          requestContext,
          reasonCode: MFA_AUDIT_REASONS.RATE_LIMITED,
        });
      }
    }

    throw error;
  }
}

export async function startMfaEnrollment({
  user,
  password,
  challengeToken = null,
  requestContext,
}) {
  if (challengeToken) {
    await resolveMfaChallenge(challengeToken, {
      expectedPurpose: MFA_CHALLENGE_PURPOSE.ENROLLMENT,
      expectedUserId: user.id,
    });
  } else if (!password) {
    throw mfaError("Password confirmation is required", 401, "AUTHENTICATION_REQUIRED");
  } else {
    const userRow = await findUserByEmail(user.email);
    const passwordOk = await verifyPassword(password, userRow?.password_hash);

    if (!passwordOk) {
      throw mfaError("Invalid email or password", 401, "AUTHENTICATION_REQUIRED");
    }
  }

  if (!isPrivilegedRole(user.role)) {
    throw mfaError("MFA enrollment is not available for this account", 403, "INSUFFICIENT_PERMISSIONS");
  }

  await invalidatePendingTotpFactors(user.id);

  const secret = generateSecret();
  const { encryptedSecret, encryptionNonce, keyVersion } = encryptTotpSecret(secret);
  const factorId = randomUUID();

  await createPendingTotpFactor({
    id: factorId,
    userId: user.id,
    encryptedSecret,
    encryptionNonce,
    keyVersion,
  });

  const otpauthUri = generateURI({
    issuer: mfaConfig.issuer,
    label: user.email,
    secret,
  });

  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri, { errorCorrectionLevel: "M" });

  await auditMfaEvent({
    eventType: AUDIT_EVENT_TYPES.MFA_ENROLLMENT_STARTED,
    action: "mfa_enrollment_start",
    result: AUDIT_RESULTS.SUCCESS,
    actor: user,
    targetId: user.id,
    requestContext,
  });

  return {
    factorId,
    otpauthUri,
    qrCodeDataUrl,
    secret,
  };
}

export async function confirmMfaEnrollment({
  user,
  code,
  challengeToken = null,
  requestContext,
}) {
  if (challengeToken) {
    await resolveMfaChallenge(challengeToken, {
      expectedPurpose: MFA_CHALLENGE_PURPOSE.ENROLLMENT,
      expectedUserId: user.id,
    });
  }

  const pending = await findPendingTotpFactorByUserId(user.id);

  if (!pending) {
    throw mfaError("No pending MFA enrollment", 400, "BAD_REQUEST");
  }

  const verification = await verifyTotpForPendingFactor(pending, code);

  if (!verification.ok) {
    await auditMfaEvent({
      eventType: AUDIT_EVENT_TYPES.MFA_ENROLLMENT_FAILED,
      action: "mfa_enrollment_confirm",
      result: AUDIT_RESULTS.FAILURE,
      actor: user,
      targetId: user.id,
      requestContext,
      reasonCode: verification.replay
        ? MFA_AUDIT_REASONS.REPLAY
        : MFA_AUDIT_REASONS.INVALID_CODE,
    });

    if (verification.replay) {
      throw replayDetectedError();
    }

    throw invalidMfaCodeError();
  }

  const recoveryRecords = await buildRecoveryCodeRecords();
  const activated = await activateEnrollmentTransaction({
    factorId: pending.id,
    userId: user.id,
    timestep: verification.timestep,
    recoveryCodes: recoveryRecords.map(({ id, codeHash }) => ({ id, codeHash })),
  });

  if (!activated) {
    throw mfaError("MFA enrollment could not be completed", 500, "INTERNAL_SERVER_ERROR");
  }

  await bumpSessionSecurityVersion(user.id);
  await revokeUserRefreshTokens(user.id);

  if (challengeToken) {
    const challenge = await findMfaChallengeByTokenHash(hashToken(challengeToken));

    if (challenge) {
      await consumeMfaChallenge(challenge.id);
    }
  }

  const sessionSecurityVersion = await getSessionSecurityVersion(user.id);
  const session = await createAuthSession(user, requestContext, {
    mfaCompleted: true,
    sessionSecurityVersion,
  });

  await auditMfaEvent({
    eventType: AUDIT_EVENT_TYPES.MFA_ENROLLMENT_COMPLETED,
    action: "mfa_enrollment_confirm",
    result: AUDIT_RESULTS.SUCCESS,
    actor: user,
    targetId: user.id,
    requestContext,
  });

  return {
    recoveryCodes: recoveryRecords.map((entry) => entry.plaintext),
    ...session,
  };
}

export async function regenerateRecoveryCodes({ user, password, requestContext }) {
  const userRow = await findUserByEmail(user.email);
  const passwordOk = await verifyPassword(password, userRow?.password_hash);

  if (!passwordOk) {
    throw mfaError("Invalid email or password", 401, "AUTHENTICATION_REQUIRED");
  }

  const factor = await findActiveTotpFactorByUserId(user.id);

  if (!factor) {
    throw enrollmentRequiredError();
  }

  const recoveryRecords = await buildRecoveryCodeRecords();
  await deleteRecoveryCodesByUserId(user.id);
  await insertRecoveryCodes({
    userId: user.id,
    codes: recoveryRecords.map(({ id, codeHash }) => ({ id, codeHash })),
  });

  await auditMfaEvent({
    eventType: AUDIT_EVENT_TYPES.MFA_RECOVERY_CODES_REGENERATED,
    action: "recovery_codes_regenerate",
    result: AUDIT_RESULTS.SUCCESS,
    actor: user,
    targetId: user.id,
    requestContext,
  });

  return {
    recoveryCodes: recoveryRecords.map((entry) => entry.plaintext),
  };
}

export async function disableUserMfa({
  user,
  password,
  code,
  recoveryCode,
  requestContext,
}) {
  if (isPrivilegedRole(user.role)) {
    throw mfaError(
      "MFA cannot be disabled for privileged accounts",
      403,
      MFA_ERROR_CODES.MFA_DISABLE_BLOCKED
    );
  }

  const userRow = await findUserByEmail(user.email);
  const passwordOk = await verifyPassword(password, userRow?.password_hash);

  if (!passwordOk) {
    throw mfaError("Invalid email or password", 401, "AUTHENTICATION_REQUIRED");
  }

  const factor = await findActiveTotpFactorByUserId(user.id);

  if (!factor) {
    throw mfaError("MFA is not enabled", 400, "BAD_REQUEST");
  }

  let verified = false;

  if (recoveryCode) {
    verified = await verifyAndConsumeRecoveryCode(
      user.id,
      normalizeRecoveryCode(recoveryCode)
    );
  } else {
    const result = await verifyTotpForFactor(factor, code);
    verified = result.ok;

    if (!verified && result.replay) {
      throw replayDetectedError();
    }
  }

  if (!verified) {
    throw invalidMfaCodeError();
  }

  await disableActiveTotpFactor(user.id);
  await deleteRecoveryCodesByUserId(user.id);
  await bumpSessionSecurityVersion(user.id);
  await revokeUserRefreshTokens(user.id);

  await auditMfaEvent({
    eventType: AUDIT_EVENT_TYPES.MFA_DISABLED,
    action: "mfa_disable",
    result: AUDIT_RESULTS.SUCCESS,
    actor: user,
    targetId: user.id,
    requestContext,
  });

  return { message: "MFA disabled successfully" };
}

export async function adminResetUserMfa({
  actor,
  targetUserId,
  requestContext,
}) {
  const target = await findUserById(targetUserId);

  if (!target) {
    throw mfaError("User not found", 404, "USER_NOT_FOUND");
  }

  await resetUserMfaFactors(targetUserId);
  await deleteRecoveryCodesByUserId(targetUserId);
  await bumpSessionSecurityVersion(targetUserId);
  await revokeUserRefreshTokens(targetUserId);
  await invalidateUserMfaChallenges(targetUserId);

  await auditMfaEvent({
    eventType: AUDIT_EVENT_TYPES.MFA_ADMIN_RESET,
    action: "mfa_admin_reset",
    result: AUDIT_RESULTS.SUCCESS,
    actor,
    targetId: targetUserId,
    requestContext,
    metadata: { targetRole: target.role },
  });

  return { message: "MFA reset; user must re-enroll" };
}

export async function performStepUp({
  user,
  code,
  recoveryCode,
  sessionId,
  requestContext,
}) {
  const factor = await findActiveTotpFactorByUserId(user.id);

  if (!factor) {
    throw enrollmentRequiredError();
  }

  let verified = false;

  if (recoveryCode) {
    verified = await verifyAndConsumeRecoveryCode(
      user.id,
      normalizeRecoveryCode(recoveryCode)
    );

    if (verified) {
      await auditMfaEvent({
        eventType: AUDIT_EVENT_TYPES.MFA_RECOVERY_CODE_USED,
        action: "step_up_recovery",
        result: AUDIT_RESULTS.SUCCESS,
        actor: user,
        targetId: user.id,
        requestContext,
        metadata: { sessionId },
      });
    }

    if (!verified) {
      throw invalidRecoveryCodeError();
    }
  } else {
    const result = await verifyTotpForFactor(factor, code);

    if (!result.ok) {
      await auditMfaEvent({
        eventType: AUDIT_EVENT_TYPES.MFA_STEP_UP_FAILED,
        action: "step_up",
        result: AUDIT_RESULTS.FAILURE,
        actor: user,
        targetId: user.id,
        requestContext,
        reasonCode: result.replay
          ? MFA_AUDIT_REASONS.REPLAY
          : MFA_AUDIT_REASONS.INVALID_CODE,
        metadata: { sessionId },
      });

      if (result.replay) {
        throw replayDetectedError();
      }

      throw invalidMfaCodeError();
    }

    verified = true;
  }

  const sessionSecurityVersion = await getSessionSecurityVersion(user.id);
  const { refreshMfaCompletedAt } = await import("./session.service.js");

  const refreshed = await refreshMfaCompletedAt({
    sessionId,
    user,
    sessionSecurityVersion,
  });

  await auditMfaEvent({
    eventType: AUDIT_EVENT_TYPES.MFA_STEP_UP_SUCCESS,
    action: "step_up",
    result: AUDIT_RESULTS.SUCCESS,
    actor: user,
    targetId: user.id,
    requestContext,
    metadata: { sessionId },
  });

  return refreshed;
}

export function assertStepUpFresh(mfaCompletedAt, maxAgeSeconds = mfaConfig.stepUpMaxAgeSeconds) {
  if (!mfaCompletedAt) {
    throw stepUpRequiredError();
  }

  const ageMs = Date.now() - new Date(mfaCompletedAt).getTime();

  if (ageMs > maxAgeSeconds * 1000) {
    throw stepUpRequiredError();
  }
}

export async function getMfaStatus(userId) {
  const active = await hasActiveMfa(userId);
  const unusedRecoveryCodes = active ? await countUnusedRecoveryCodes(userId) : 0;

  return {
    enrolled: active,
    unusedRecoveryCodes,
  };
}

export {
  challengeConsumedError,
  challengeExpiredError,
  challengeInvalidError,
  enrollmentRequiredError,
  hasActiveMfa,
  invalidMfaCodeError,
  isPrivilegedRole,
  stepUpRequiredError,
};
