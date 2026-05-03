import { findLatestAgreementByLeadId } from "../repositories/agreement.repository.js";
import { renderHtmlToPdfBuffer } from "./pdf.service.js";

export async function getAgreementByLeadId(leadId) {
  return findLatestAgreementByLeadId(leadId);
}

export async function renderAgreementPdfByLeadId(leadId) {
  const agreement = await findLatestAgreementByLeadId(leadId);

  if (!agreement) {
    return null;
  }

  const pdfBuffer = await renderHtmlToPdfBuffer({
    title: agreement.title || "Agreement",
    html: agreement.html_content,
  });

  return {
    agreement,
    pdfBuffer,
  };
}
