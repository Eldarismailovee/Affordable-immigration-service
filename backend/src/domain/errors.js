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

export function paymentCardDataInNotesError() {
  return new AppError(
    "Do not enter card numbers or security codes in notes. Please use the secure payment link.",
    400,
    "PAYMENT_CARD_DATA_IN_NOTES"
  );
}

export function invalidHostedPaymentUrlError(message = "Invalid hosted payment URL") {
  return new AppError(message, 400, "INVALID_HOSTED_PAYMENT_URL");
}

export function intakeNotFoundError() {
  return new AppError(
    "Intake record not found for this lead",
    404,
    "INTAKE_NOT_FOUND"
  );
}

export function agreementNotFoundError() {
  return new AppError("Agreement not found", 404, "AGREEMENT_NOT_FOUND");
}

export function onboardingPacketNotFoundError() {
  return new AppError("Onboarding packet not found", 404, "ONBOARDING_PACKET_NOT_FOUND");
}

export function invalidLeadStateTransitionError() {
  return new AppError(
    "Invalid lead state transition",
    400,
    "INVALID_LEAD_STATE_TRANSITION"
  );
}

export function packetNotApprovedError() {
  return new AppError(
    "Document is not approved for download",
    403,
    "PACKET_NOT_APPROVED"
  );
}

export function dsarRequestNotFoundError() {
  return new AppError("DSAR request not found", 404, "DSAR_REQUEST_NOT_FOUND");
}

export function dsarAccessDeniedError() {
  return new AppError("You do not have access to this DSAR request", 403, "DSAR_ACCESS_DENIED");
}

export function dsarIdentityNotVerifiedError() {
  return new AppError(
    "Identity verification is required before this action",
    403,
    "DSAR_IDENTITY_NOT_VERIFIED"
  );
}

export function dsarLegalHoldError() {
  return new AppError(
    "Request is under legal hold and cannot be processed for deletion or anonymization",
    409,
    "DSAR_LEGAL_HOLD"
  );
}

export function dsarInvalidStatusTransitionError() {
  return new AppError("Invalid DSAR request status transition", 400, "DSAR_INVALID_STATUS");
}

export function dsarExportNotAvailableError() {
  return new AppError("Export is not available for this request", 404, "DSAR_EXPORT_NOT_AVAILABLE");
}

export function dsarInvalidCorrectionFieldsError(field) {
  return new AppError(
    `Field "${field}" cannot be corrected through a privacy request`,
    400,
    "DSAR_INVALID_CORRECTION_FIELD"
  );
}

export function dsarPdfUnavailableError() {
  return new AppError(
    "PDF export is temporarily unavailable",
    503,
    "DSAR_PDF_UNAVAILABLE"
  );
}

export function dsarEmailRequiredError() {
  return new AppError(
    "Email is required for anonymous privacy requests",
    400,
    "DSAR_EMAIL_REQUIRED"
  );
}

export function dsarAccountRequiredError() {
  return new AppError(
    "This privacy request requires an associated account before processing",
    400,
    "DSAR_ACCOUNT_REQUIRED"
  );
}

export function processingRestrictedError() {
  return new AppError(
    "Processing is restricted for this account",
    403,
    "PROCESSING_RESTRICTED"
  );
}
