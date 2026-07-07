/**
 * Validates password policy for privileged account provisioning.
 * @param {string} password
 * @returns {{ valid: boolean, message?: string }}
 */
export function validatePrivilegedPassword(password) {
  if (typeof password !== "string" || password.length < 12) {
    return {
      valid: false,
      message: "Password must be at least 12 characters",
    };
  }

  if (password.length > 128) {
    return {
      valid: false,
      message: "Password must be at most 128 characters",
    };
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);

  if (!hasLower || !hasUpper || !hasDigit) {
    return {
      valid: false,
      message: "Password must include uppercase, lowercase, and numeric characters",
    };
  }

  return { valid: true };
}
