import { findLatestOnboardingPacketByLeadId } from "../repositories/onboarding.repository.js";
import { renderHtmlToPdfBuffer } from "./pdf.service.js";

export async function getOnboardingPacketByLeadId(leadId) {
  return findLatestOnboardingPacketByLeadId(leadId);
}

export async function renderOnboardingPdfByLeadId(leadId) {
  const packet = await findLatestOnboardingPacketByLeadId(leadId);

  if (!packet) {
    return null;
  }

  const pdfBuffer = await renderHtmlToPdfBuffer({
    title: packet.title || "Onboarding Packet",
    html: packet.html_content,
  });

  return {
    packet,
    pdfBuffer,
  };
}
