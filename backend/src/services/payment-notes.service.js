import { DEFAULT_PAYMENT_NOTE } from "../constants/payment.js";
import { logger } from "../lib/logger.js";
import {
  assertNoPaymentCardData,
  containsCardLikeData,
  redactPaymentSensitiveText,
} from "../utils/paymentRedaction.js";

export function getDefaultPaymentNote() {
  return DEFAULT_PAYMENT_NOTE;
}

export function prepareUserPaymentNotes(notes) {
  const value = typeof notes === "string" ? notes.trim() : "";

  if (!value) {
    return DEFAULT_PAYMENT_NOTE;
  }

  assertNoPaymentCardData(value);
  return value;
}

export function sanitizeAdminNotes(notes) {
  if (typeof notes !== "string") {
    return { text: notes, redacted: false };
  }

  const trimmed = notes.trim();
  if (!trimmed) {
    return { text: notes, redacted: false };
  }

  if (!containsCardLikeData(trimmed)) {
    return { text: notes, redacted: false };
  }

  logger.warn(
    { event: "payment_sensitive_redacted" },
    "Redacted card-like data from admin notes"
  );

  return {
    text: redactPaymentSensitiveText(trimmed),
    redacted: true,
  };
}

export function textForAdminStorage(notes) {
  if (typeof notes !== "string" || notes.trim().length === 0) {
    return notes;
  }

  return sanitizeAdminNotes(notes).text;
}
