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
import { AppError } from "../utils/appError.js";
import { assertAdminAccess } from "./access.service.js";

export async function getLeadDetail({ leadId, actor }) {
  assertAdminAccess(actor);

  const lead = await findLeadById(leadId);

  if (!lead) {
    throw new AppError("Lead not found", 404, "LEAD_NOT_FOUND");
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
    throw new AppError("Lead not found", 404, "LEAD_NOT_FOUND");
  }

  return lead;
}
