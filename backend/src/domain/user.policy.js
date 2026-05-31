import { ADMIN_ROLE, ATTORNEY_ROLE } from "../constants/domain.js";
import {
  authenticationRequiredError,
  insufficientPermissionsError,
  invalidRoleError,
  lastActiveAdminError,
} from "./errors.js";
import { userRoleSchema } from "./validators.js";

export function isAdmin(user) {
  return user?.role === ADMIN_ROLE;
}

export function isAttorney(user) {
  return user?.role === ATTORNEY_ROLE;
}

export function isStaff(user) {
  return isAdmin(user) || isAttorney(user);
}

export function assertAuthenticated(user) {
  if (!user) {
    throw authenticationRequiredError();
  }

  return user;
}

export function assertAdmin(user) {
  assertAuthenticated(user);

  if (!isAdmin(user)) {
    throw insufficientPermissionsError();
  }

  return user;
}

export function assertAttorneyAccess(user) {
  assertAuthenticated(user);

  if (!isStaff(user)) {
    throw insufficientPermissionsError();
  }

  return user;
}

export function parseUserRole(role) {
  const result = userRoleSchema.safeParse(role);

  if (!result.success) {
    throw invalidRoleError();
  }

  return result.data;
}

export function isRemovingAdminRole(user, nextRole) {
  return isAdmin(user) && nextRole !== ADMIN_ROLE;
}

export function assertCanRemoveAdminRole({ user, nextRole, activeAdminCount }) {
  if (isRemovingAdminRole(user, nextRole) && activeAdminCount <= 1) {
    throw lastActiveAdminError();
  }
}

export function assertCanDeleteUser({ user, activeAdminCount }) {
  if (isAdmin(user) && activeAdminCount <= 1) {
    throw lastActiveAdminError();
  }
}
