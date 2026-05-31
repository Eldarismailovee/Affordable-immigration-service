import {
  findLeadById,
  findLatestBookingByLeadId,
  findLatestDocketwiseSyncByLeadId,
  findLatestIntakeByLeadId,
  findLatestPaymentByLeadId,
  softDeleteLeadById,
} from "../repositories/lead.repository.js";
import { findLatestAgreementByLeadId } from "../repositories/agreement.repository.js";
import { findLatestOnboardingPacketByLeadId } from "../repositories/onboarding.repository.js";
import { leadNotFoundError } from "../domain/errors.js";
import { isLeadVisibleToAttorney } from "../domain/lead-state.policy.js";
import { isAttorney } from "../domain/user.policy.js";
import { AppError } from "../utils/appError.js";
import { assertAdminAccess, assertStaffAccess } from "./access.service.js";

export async function getLeadDetail({ leadId, actor }) {
  assertStaffAccess(actor);

  const lead = await findLeadById(leadId);

  if (!lead) {
    throw leadNotFoundError();
  }

  if (isAttorney(actor) && !isLeadVisibleToAttorney(lead)) {
    throw new AppError("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
  }

  return {
    lead,
    intake: await findLatestIntakeByLeadId(leadId),
    agreement: await findLatestAgreementByLeadId(leadId),
    onboarding: await findLatestOnboardingPacketByLeadId(leadId),
    booking: await findLatestBookingByLeadId(leadId),
    payment: await findLatestPaymentByLeadId(leadId),
    docketwise: await findLatestDocketwiseSyncByLeadId(leadId),
  };
}

export async function deleteLead({ leadId, actor }) {
  assertAdminAccess(actor);

  const lead = await softDeleteLeadById(leadId);

  if (!lead) {
    throw leadNotFoundError();
  }

  return lead;
}
