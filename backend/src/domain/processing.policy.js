import { processingRestrictedError } from "./errors.js";

export function isProcessingRestricted(user) {
  return Boolean(user?.processing_restricted_at ?? user?.processingRestrictedAt);
}

export function assertProcessingNotRestricted(user) {
  if (isProcessingRestricted(user)) {
    throw processingRestrictedError();
  }
}
