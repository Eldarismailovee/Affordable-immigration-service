import { ADMIN_ROLE, ATTORNEY_ROLE } from "./domain.js";

export const PRIVILEGED_ROLES = [ADMIN_ROLE, ATTORNEY_ROLE];

export const MFA_FACTOR_TYPE = {
  TOTP: "totp",
};

export const MFA_FACTOR_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  DISABLED: "disabled",
};

export const MFA_CHALLENGE_PURPOSE = {
  LOGIN: "login",
  ENROLLMENT: "enrollment",
  STEP_UP: "step_up",
};

export const MFA_RECOVERY_CODE_COUNT = 10;
export const MFA_RECOVERY_CODE_SEGMENT_LENGTH = 4;
export const MFA_RECOVERY_CODE_SEGMENTS = 3;

export const MFA_ERROR_CODES = {
  MFA_REQUIRED: "MFA_REQUIRED",
  MFA_ENROLLMENT_REQUIRED: "MFA_ENROLLMENT_REQUIRED",
  MFA_CHALLENGE_INVALID: "MFA_CHALLENGE_INVALID",
  MFA_CHALLENGE_EXPIRED: "MFA_CHALLENGE_EXPIRED",
  MFA_CHALLENGE_CONSUMED: "MFA_CHALLENGE_CONSUMED",
  MFA_INVALID: "MFA_INVALID",
  MFA_REPLAY_DETECTED: "MFA_REPLAY_DETECTED",
  STEP_UP_REQUIRED: "STEP_UP_REQUIRED",
  RECOVERY_CODE_INVALID: "RECOVERY_CODE_INVALID",
  MFA_DISABLE_BLOCKED: "MFA_DISABLE_BLOCKED",
};

export const MFA_AUDIT_REASONS = {
  INVALID_CODE: "invalid_code",
  REPLAY: "replay_detected",
  RATE_LIMITED: "rate_limited",
  CHALLENGE_EXPIRED: "challenge_expired",
  CHALLENGE_CONSUMED: "challenge_consumed",
  CHALLENGE_INVALID: "challenge_invalid",
  STEP_UP_STALE: "step_up_stale",
};

export function isPrivilegedRole(role) {
  return PRIVILEGED_ROLES.includes(role);
}
