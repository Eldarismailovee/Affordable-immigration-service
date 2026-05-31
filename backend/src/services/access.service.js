import { insufficientPermissionsError, leadNotFoundError } from "../domain/errors.js";
import { assertCanAccessLead } from "../domain/lead.policy.js";
import {
  assertAdmin,
  assertAuthenticated,
  isAttorney,
  isStaff,
} from "../domain/user.policy.js";
import { findLeadById } from "../repositories/lead.repository.js";

export async function assertLeadAccess(user, leadId) {
  assertAuthenticated(user);

  const lead = await findLeadById(leadId);

  if (!lead) {
    throw leadNotFoundError();
  }

  return assertCanAccessLead(user, lead);
}

export function assertAdminAccess(user) {
  return assertAdmin(user);
}

export function assertStaffAccess(user) {
  assertAuthenticated(user);

  if (!isStaff(user)) {
    throw insufficientPermissionsError();
  }

  return user;
}

export function assertAttorneyAccess(user) {
  assertAuthenticated(user);

  if (!isAttorney(user) && !isAdmin(user)) {
    throw insufficientPermissionsError();
  }

  return user;
}
