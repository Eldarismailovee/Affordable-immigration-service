import { randomUUID } from "crypto";
import { GENERATED_DOCUMENT_STATUS } from "../constants/domain.js";
import {
  findLatestIntakeByLeadId,
  findLeadById,
} from "../repositories/lead.repository.js";
import {
  createOnboardingPacket,
  findLatestOnboardingPacketByLeadId,
} from "../repositories/onboarding.repository.js";
import { AppError } from "../utils/appError.js";
import { generateOnboardingPacket } from "./onboarding.service.js";
import { assertAdminAccess } from "./access.service.js";

export async function generateOnboardingPacketForLead({ leadId, actor }) {
  assertAdminAccess(actor);

  const lead = await findLeadById(leadId);

  if (!lead) {
    throw new AppError("Lead not found", 404, "LEAD_NOT_FOUND");
  }

  const intake = await findLatestIntakeByLeadId(leadId);

  if (!intake) {
    throw new AppError("Intake record not found for this lead", 404, "INTAKE_NOT_FOUND");
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

  await createOnboardingPacket({
    id: randomUUID(),
    leadId,
    title: packet.title,
    htmlContent: packet.html,
    status: GENERATED_DOCUMENT_STATUS,
  });
  const created = await findLatestOnboardingPacketByLeadId(leadId);

  return {
    alreadyExists: false,
    onboarding: created,
  };
}
