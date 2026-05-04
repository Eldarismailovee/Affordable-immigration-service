import { randomUUID } from "crypto";
import { GENERATED_DOCUMENT_STATUS } from "../constants/domain.js";
import {
  findLatestIntakeByLeadId,
  findLeadById,
  updateIntakeAgreementStatusByLeadId,
} from "../repositories/lead.repository.js";
import {
  createAgreement,
  findLatestAgreementByLeadId,
} from "../repositories/agreement.repository.js";
import { withUnitOfWork } from "../repositories/unit-of-work.repository.js";
import { AppError } from "../utils/appError.js";
import { generateAgreement } from "./agreement.service.js";
import { assertAdminAccess } from "./access.service.js";

export async function generateAgreementForLead({ leadId, actor }) {
  assertAdminAccess(actor);

  const lead = await findLeadById(leadId);

  if (!lead) {
    throw new AppError("Lead not found", 404, "LEAD_NOT_FOUND");
  }

  const intake = await findLatestIntakeByLeadId(leadId);

  if (!intake) {
    throw new AppError("Intake record not found for this lead", 404, "INTAKE_NOT_FOUND");
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

  const created = await withUnitOfWork(async (client) => {
    await createAgreement(
      {
        id: randomUUID(),
        leadId,
        title: agreement.agreementTitle,
        htmlContent: agreement.html,
        status: GENERATED_DOCUMENT_STATUS,
      },
      client
    );

    await updateIntakeAgreementStatusByLeadId(leadId, GENERATED_DOCUMENT_STATUS, client);
    return findLatestAgreementByLeadId(leadId, client);
  });

  return {
    alreadyExists: false,
    agreement: created,
  };
}
