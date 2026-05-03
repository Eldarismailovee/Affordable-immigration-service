import { randomUUID } from "crypto";
import {
  findLatestIntakeByLeadId,
  findLeadById,
  updateIntakeAgreementStatusByLeadId,
} from "../repositories/lead.repository.js";
import {
  createAgreement,
  findLatestAgreementByLeadId,
} from "../repositories/agreement.repository.js";
import { withTransaction } from "../repositories/transaction.js";
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

  const agreementId = randomUUID();

  return withTransaction(async (client) => {
    await createAgreement(
      {
        id: agreementId,
        leadId,
        title: agreement.agreementTitle,
        htmlContent: agreement.html,
      },
      client
    );

    await updateIntakeAgreementStatusByLeadId(leadId, "generated", client);

    const created = await findLatestAgreementByLeadId(leadId, client);

    return {
      alreadyExists: false,
      agreement: created,
    };
  });
}
