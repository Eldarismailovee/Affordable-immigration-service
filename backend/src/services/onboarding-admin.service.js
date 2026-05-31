import { randomUUID } from "crypto";
import { DRAFT_PACKET_STATUS } from "../constants/domain.js";
import {
  findLatestIntakeByLeadId,
  findLeadById,
} from "../repositories/lead.repository.js";
import {
  createOnboardingPacket,
  findLatestOnboardingPacketByLeadId,
} from "../repositories/onboarding.repository.js";
import { isUniqueViolation } from "../db/errors.js";
import { intakeNotFoundError, leadNotFoundError } from "../domain/errors.js";
import { assertLeadCanGenerateFilingPacket } from "../domain/lead-workflow.policy.js";
import { generateOnboardingPacket } from "./onboarding.service.js";
import { assertStaffAccess } from "./access.service.js";
import { enrichLeadWithWorkflow } from "./conflict-check.service.js";

export async function generateOnboardingPacketForLead({ leadId, actor }) {
  assertStaffAccess(actor);

  const lead = await findLeadById(leadId);

  if (!lead) {
    throw leadNotFoundError();
  }

  const enrichedLead = await enrichLeadWithWorkflow(lead);
  assertLeadCanGenerateFilingPacket(enrichedLead);

  const intake = await findLatestIntakeByLeadId(leadId);

  if (!intake) {
    throw intakeNotFoundError();
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

  let createdNew = false;

  try {
    await createOnboardingPacket({
      id: randomUUID(),
      leadId,
      title: packet.title,
      htmlContent: packet.html,
      status: DRAFT_PACKET_STATUS,
    });
    createdNew = true;
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
  }

  const created = await findLatestOnboardingPacketByLeadId(leadId);

  return {
    alreadyExists: !createdNew,
    onboarding: created,
  };
}
