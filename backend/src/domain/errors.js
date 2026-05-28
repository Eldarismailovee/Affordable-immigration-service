export class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_SERVER_ERROR") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function isAppError(error) {
  return error instanceof AppError;
}

export function authenticationRequiredError() {
  return new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");
}

export function insufficientPermissionsError() {
  return new AppError("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
}

export function leadNotFoundError() {
  return new AppError("Lead not found", 404, "LEAD_NOT_FOUND");
}

export function leadAccessDeniedError() {
  return new AppError("You do not have access to this lead", 403, "LEAD_ACCESS_DENIED");
}

export function userNotFoundError() {
  return new AppError("User not found", 404, "USER_NOT_FOUND");
}

export function invalidRoleError() {
  return new AppError("Invalid role", 400, "INVALID_ROLE");
}

export function lastActiveAdminError() {
  return new AppError(
    "At least one active administrator is required",
    400,
    "LAST_ACTIVE_ADMIN"
  );
}

export function invalidPaymentStatusError() {
  return new AppError("Invalid payment status", 400, "INVALID_PAYMENT_STATUS");
}

export function paymentNotFoundError() {
  return new AppError("Payment record not found", 404, "PAYMENT_NOT_FOUND");
}
