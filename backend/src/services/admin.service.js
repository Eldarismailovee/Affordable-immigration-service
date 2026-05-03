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

export async function getLeadDetail(leadId) {
  const lead = await findLeadById(leadId);

  if (!lead) {
    return null;
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

export async function deleteLead(leadId) {
  const lead = await softDeleteLeadById(leadId);

  if (!lead) {
    const error = new Error("Lead not found");
    error.statusCode = 404;
    throw error;
  }

  return lead;
}
