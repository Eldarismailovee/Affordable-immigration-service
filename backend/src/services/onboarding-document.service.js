import { assertPacketApprovedForDownload } from "../domain/packet.policy.js";
import { assertLeadCanShowLegalRecommendation } from "../domain/lead-workflow.policy.js";
import { findLatestIntakeByLeadId } from "../repositories/lead.repository.js";
import { findLatestOnboardingPacketByLeadId } from "../repositories/onboarding.repository.js";
import { onboardingPacketNotFoundError } from "../domain/errors.js";
import { isStaff } from "../domain/user.policy.js";
import { loadLeadDocument, renderLeadDocumentPdf } from "../utils/leadDocument.js";
import {
  auditDocumentDownload,
  auditDocumentPdfGenerate,
  auditDocumentView,
} from "../utils/documentAudit.js";

export async function getOnboardingPacketByLeadId(leadId, user, auditContext = null) {
  const packet = await loadLeadDocument(
    leadId,
    user,
    findLatestOnboardingPacketByLeadId,
    onboardingPacketNotFoundError
  );

  const intake = await findLatestIntakeByLeadId(leadId);
  assertLeadCanShowLegalRecommendation({
    lead: null,
    intake,
    actorIsStaff: isStaff(user),
  });

  if (auditContext) {
    await auditDocumentView({
      leadId,
      document: packet,
      documentType: "onboarding",
      user,
      auditContext,
    });
  }

  return packet;
}

export async function renderOnboardingPdfByLeadId(leadId, user, auditContext = null) {
  const packet = await loadLeadDocument(
    leadId,
    user,
    findLatestOnboardingPacketByLeadId,
    onboardingPacketNotFoundError
  );
  assertPacketApprovedForDownload(packet);
  const pdfBuffer = await renderLeadDocumentPdf(packet, "Onboarding Packet");

  if (auditContext) {
    await auditDocumentPdfGenerate({
      leadId,
      document: packet,
      documentType: "onboarding",
      user,
      auditContext,
    });
    await auditDocumentDownload({
      leadId,
      document: packet,
      documentType: "onboarding",
      user,
      auditContext,
    });
  }

  return {
    packet,
    pdfBuffer,
  };
}
