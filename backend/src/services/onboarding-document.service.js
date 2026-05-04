import { findLatestOnboardingPacketByLeadId } from "../repositories/onboarding.repository.js";
import { AppError } from "../utils/appError.js";
import { assertLeadAccess } from "./access.service.js";
import { renderHtmlToPdfBuffer } from "./pdf.service.js";

export async function getOnboardingPacketByLeadId(leadId, user) {
  await assertLeadAccess(user, leadId);
  const packet = await findLatestOnboardingPacketByLeadId(leadId);

  if (!packet) {
    throw new AppError("Onboarding packet not found", 404, "ONBOARDING_PACKET_NOT_FOUND");
  }

  return packet;
}

export async function renderOnboardingPdfByLeadId(leadId, user) {
  await assertLeadAccess(user, leadId);
  const packet = await findLatestOnboardingPacketByLeadId(leadId);

  if (!packet) {
    throw new AppError("Onboarding packet not found", 404, "ONBOARDING_PACKET_NOT_FOUND");
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
