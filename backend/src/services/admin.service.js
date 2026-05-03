import {
  findLeadById,
  findLatestBookingByLeadId,
  findLatestDocketwiseSyncByLeadId,
  findLatestIntakeByLeadId,
  findLatestPaymentByLeadId,
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
