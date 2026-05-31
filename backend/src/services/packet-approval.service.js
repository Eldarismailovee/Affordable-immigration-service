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
    reviewNotes,
  });

  if (!approved) {
    throw new AppError("Only draft packets can be approved", 400, "PACKET_NOT_DRAFT");
  }

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
    reviewNotes,
  });

  if (!approved) {
    throw new AppError("Only draft packets can be approved", 400, "PACKET_NOT_DRAFT");
  }

  return approved;
}
