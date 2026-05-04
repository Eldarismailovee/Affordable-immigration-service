import { ADMIN_ROLE } from "../constants/domain.js";
import { findLeadById } from "../repositories/lead.repository.js";
import { AppError } from "../utils/appError.js";

export async function assertLeadAccess(user, leadId) {
  if (!user) {
    throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");
  }

  const lead = await findLeadById(leadId);

  if (!lead) {
    throw new AppError("Lead not found", 404, "LEAD_NOT_FOUND");
  }

  if (user.role !== ADMIN_ROLE && lead.user_id !== user.id) {
    throw new AppError("You do not have access to this lead", 403, "LEAD_ACCESS_DENIED");
  }

  return lead;
}

export function assertAdminAccess(user) {
  if (!user) {
    throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");
  }

  if (user.role !== ADMIN_ROLE) {
    throw new AppError("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
  }
}
