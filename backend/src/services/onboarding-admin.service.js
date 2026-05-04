import {
  findLatestIntakeByLeadId,
  findLeadById,
} from "../repositories/lead.repository.js";
import {
  createOnboardingPacketForLead,
  findLatestOnboardingPacketByLeadId,
} from "../repositories/onboarding.repository.js";
import { generateOnboardingPacket } from "./onboarding.service.js";

export async function generateOnboardingPacketForLead(leadId) {
  const lead = await findLeadById(leadId);

  if (!lead) {
    throw new Error("Lead not found");
  }

  const intake = await findLatestIntakeByLeadId(leadId);

  if (!intake) {
    throw new Error("Intake record not found for this lead");
  }

  const existing = await findLatestOnboardingPacketByLeadId(leadId);

  if (existing) {
    return {
      alreadyExists: true,
      onboarding: existing,
    };
  }

  const packet = generateOnboardingPacket({
    firstName: lead.first_name,
    lastName: lead.last_name,
    email: lead.email,
    phone: lead.phone,
    selectedPackage: intake.selected_package,
    caseType: intake.case_type,
    notes: intake.notes || "",
    additionalI130Count: Number(intake.additional_i130_count || 0),
    expedited: Boolean(intake.expedited),
  });

  const created = await createOnboardingPacketForLead({
    leadId,
    title: packet.title,
    htmlContent: packet.html,
  });

  return {
    alreadyExists: false,
    onboarding: created,
  };
}
