import {
  approveAgreementByLeadId,
  findLatestAgreementByLeadId,
} from "../repositories/agreement.repository.js";
import {
  approveOnboardingPacketByLeadId,
  findLatestOnboardingPacketByLeadId,
} from "../repositories/onboarding.repository.js";
import {
  agreementNotFoundError,
  onboardingPacketNotFoundError,
} from "../domain/errors.js";
import {
  assertAttorneyCanApprovePacket,
  assertPacketIsDraft,
} from "../domain/packet.policy.js";
import { AppError } from "../utils/appError.js";
import { textForAdminStorage } from "./payment-notes.service.js";
import {
  AUDIT_CATEGORIES,
  AUDIT_EVENT_TYPES,
  AUDIT_RESULTS,
} from "../constants/audit.js";
import { recordAuditEvent } from "./audit.service.js";
import { buildActor } from "../utils/auditContext.js";

export async function approveAgreementPacket({ leadId, actor, reviewNotes }) {
  assertAttorneyCanApprovePacket(actor);

  const agreement = await findLatestAgreementByLeadId(leadId);

  if (!agreement) {
    throw agreementNotFoundError();
  }

  assertPacketIsDraft(agreement);

  const approved = await approveAgreementByLeadId({
    leadId,
    approvedBy: actor.id,
    reviewNotes: reviewNotes ? textForAdminStorage(reviewNotes) : null,
  });

  if (!approved) {
    throw new AppError("Only draft packets can be approved", 400, "PACKET_NOT_DRAFT");
  }

  await recordAuditEvent({
    eventType: AUDIT_EVENT_TYPES.AGREEMENT_ATTORNEY_APPROVED,
    category: AUDIT_CATEGORIES.LEAD_WORKFLOW,
    action: "approve",
    result: AUDIT_RESULTS.SUCCESS,
    ...buildActor(actor),
    targetType: "lead",
    targetId: leadId,
    metadata: { documentType: "agreement" },
  });

  return approved;
}

export async function approveOnboardingPacket({ leadId, actor, reviewNotes }) {
  assertAttorneyCanApprovePacket(actor);

  const packet = await findLatestOnboardingPacketByLeadId(leadId);

  if (!packet) {
    throw onboardingPacketNotFoundError();
  }

  assertPacketIsDraft(packet);

  const approved = await approveOnboardingPacketByLeadId({
    leadId,
    approvedBy: actor.id,
    reviewNotes: reviewNotes ? textForAdminStorage(reviewNotes) : null,
  });

  if (!approved) {
    throw new AppError("Only draft packets can be approved", 400, "PACKET_NOT_DRAFT");
  }

  await recordAuditEvent({
    eventType: AUDIT_EVENT_TYPES.FILING_PACKET_ATTORNEY_APPROVED,
    category: AUDIT_CATEGORIES.LEAD_WORKFLOW,
    action: "approve",
    result: AUDIT_RESULTS.SUCCESS,
    ...buildActor(actor),
    targetType: "lead",
    targetId: leadId,
    metadata: { documentType: "onboarding" },
  });

  return approved;
}
