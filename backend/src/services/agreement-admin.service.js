import { randomUUID } from "crypto";
import { DRAFT_PACKET_STATUS } from "../constants/domain.js";
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
import { isUniqueViolation } from "../db/errors.js";
import { intakeNotFoundError, leadNotFoundError } from "../domain/errors.js";
import { generateAgreement } from "./agreement.service.js";
import { assertAdminAccess } from "./access.service.js";

export async function generateAgreementForLead({ leadId, actor }) {
  assertAdminAccess(actor);

  const lead = await findLeadById(leadId);

  if (!lead) {
    throw leadNotFoundError();
  }

  const intake = await findLatestIntakeByLeadId(leadId);

  if (!intake) {
    throw intakeNotFoundError();
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

  let createdNew = false;

  const agreementRow = await withUnitOfWork(async (client) => {
    try {
      await createAgreement(
        {
          id: randomUUID(),
          leadId,
          title: agreement.agreementTitle,
          htmlContent: agreement.html,
          status: DRAFT_PACKET_STATUS,
        },
        client
      );

      await updateIntakeAgreementStatusByLeadId(leadId, "generated", client);
      createdNew = true;
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }
    }

    return findLatestAgreementByLeadId(leadId, client);
  });

  return {
    alreadyExists: !createdNew,
    agreement: agreementRow,
  };
}
