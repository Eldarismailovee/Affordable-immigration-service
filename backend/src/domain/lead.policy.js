import { assertAuthenticated, isAdmin } from "./user.policy.js";
import { leadAccessDeniedError } from "./errors.js";

export function canAccessLead(user, lead) {
  if (!user || !lead) {
    return false;
  }

  return isAdmin(user) || lead.user_id === user.id;
}

export function assertCanAccessLead(user, lead) {
  assertAuthenticated(user);

  if (!canAccessLead(user, lead)) {
    throw leadAccessDeniedError();
  }

  return lead;
}
