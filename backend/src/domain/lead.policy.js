import { isLeadVisibleToAttorney } from "./lead-state.policy.js";
import { assertAuthenticated, isAdmin, isAttorney } from "./user.policy.js";
import { leadAccessDeniedError } from "./errors.js";

export function canAccessLead(user, lead) {
  if (!user || !lead) {
    return false;
  }

  if (isAdmin(user)) {
    return true;
  }

  if (isAttorney(user)) {
    return isLeadVisibleToAttorney(lead);
  }

  return lead.user_id === user.id;
}

export function assertCanAccessLead(user, lead) {
  assertAuthenticated(user);

  if (!canAccessLead(user, lead)) {
    throw leadAccessDeniedError();
  }

  return lead;
}
