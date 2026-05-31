import { assertPacketApprovedForDownload } from "../domain/packet.policy.js";
import { findLatestOnboardingPacketByLeadId } from "../repositories/onboarding.repository.js";
import { onboardingPacketNotFoundError } from "../domain/errors.js";
import { loadLeadDocument, renderLeadDocumentPdf } from "../utils/leadDocument.js";

export async function getOnboardingPacketByLeadId(leadId, user) {
  return loadLeadDocument(
    leadId,
    user,
    findLatestOnboardingPacketByLeadId,
    onboardingPacketNotFoundError
  );
}

export async function renderOnboardingPdfByLeadId(leadId, user) {
  const packet = await loadLeadDocument(
    leadId,
    user,
    findLatestOnboardingPacketByLeadId,
    onboardingPacketNotFoundError
  );
  assertPacketApprovedForDownload(packet);
  const pdfBuffer = await renderLeadDocumentPdf(packet, "Onboarding Packet");

  return {
    packet,
    pdfBuffer,
  };
}
