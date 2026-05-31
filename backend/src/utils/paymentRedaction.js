import { paymentCardDataInNotesError } from "../domain/errors.js";

const CARD_CANDIDATE_PATTERN = /(?:\d[ -]?){13,19}/g;
const CVV_PATTERN =
  /\b(cvv|cvc|security\s*code|card\s*code)\b\s*[:#-]?\s*\d{3,4}\b/gi;
const EXPIRY_PATTERN =
  /\b(?:exp(?:iry|iration)?|valid\s*thru|valid\s*through)\b\s*[:#-]?\s*\d{1,2}\s*[/-]\s*\d{2,4}\b/gi;

export const PAYMENT_CARD_DATA_MESSAGE =
  "Do not enter card numbers or security codes in notes. Please use the secure payment link.";

export function isLuhnValid(digits) {
  if (!/^\d{13,19}$/.test(digits)) {
    return false;
  }

  let sum = 0;
  let alternate = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);

    if (alternate) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    alternate = !alternate;
  }

  return sum % 10 === 0;
}

function extractPanCandidates(text) {
  const matches = text.match(CARD_CANDIDATE_PATTERN) || [];

  return matches
    .map((match) => match.replace(/\D/g, ""))
    .filter((digits) => digits.length >= 13 && digits.length <= 19);
}

function hasLuhnValidPan(text) {
  return extractPanCandidates(text).some((digits) => isLuhnValid(digits));
}

function hasCvvLikeData(text) {
  return new RegExp(CVV_PATTERN.source, CVV_PATTERN.flags).test(text);
}

function hasExpiryLikeData(text) {
  return new RegExp(EXPIRY_PATTERN.source, EXPIRY_PATTERN.flags).test(text);
}

export function containsCardLikeData(text) {
  if (typeof text !== "string") {
    return false;
  }

  const normalized = text.trim();
  if (!normalized) {
    return false;
  }

  if (hasLuhnValidPan(normalized)) {
    return true;
  }

  if (hasCvvLikeData(normalized)) {
    return true;
  }

  if (hasExpiryLikeData(normalized)) {
    return true;
  }

  return false;
}

export function redactPaymentSensitiveText(text) {
  if (typeof text !== "string" || text.length === 0) {
    return text ?? "";
  }

  let redacted = text;

  redacted = redacted.replace(CARD_CANDIDATE_PATTERN, (match) => {
    const digits = match.replace(/\D/g, "");
    if (digits.length >= 13 && digits.length <= 19 && isLuhnValid(digits)) {
      return "[REDACTED_CARD]";
    }
    return match;
  });

  redacted = redacted.replace(CVV_PATTERN, "[REDACTED_CVV]");
  redacted = redacted.replace(EXPIRY_PATTERN, "[REDACTED_EXPIRY]");

  return redacted;
}

export function assertNoPaymentCardData(text) {
  if (containsCardLikeData(text)) {
    throw paymentCardDataInNotesError();
  }
}
