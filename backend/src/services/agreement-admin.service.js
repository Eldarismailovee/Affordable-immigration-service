import {
  findLatestIntakeByLeadId,
  findLeadById,
} from "../repositories/lead.repository.js";
import {
  createAgreementForLead,
  findLatestAgreementByLeadId,
} from "../repositories/agreement.repository.js";
import { generateAgreement } from "./agreement.service.js";

export async function generateAgreementForLead(leadId) {
  const lead = await findLeadById(leadId);

  if (!lead) {
    throw new Error("Lead not found");
  }

  const intake = await findLatestIntakeByLeadId(leadId);

  if (!intake) {
    throw new Error("Intake record not found for this lead");
  }

  const existing = await findLatestAgreementByLeadId(leadId);

  if (existing) {
    return {
      alreadyExists: true,
      agreement: existing,
    };
  }

  const agreement = generateAgreement({
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

  const created = await createAgreementForLead({
    leadId,
    title: agreement.agreementTitle,
    htmlContent: agreement.html,
  });

  return {
    alreadyExists: false,
    agreement: created,
  };
}
