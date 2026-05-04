import { findLatestAgreementByLeadId } from "../repositories/agreement.repository.js";
import { AppError } from "../utils/appError.js";
import { assertLeadAccess } from "./access.service.js";
import { renderHtmlToPdfBuffer } from "./pdf.service.js";

export async function getAgreementByLeadId(leadId, user) {
  await assertLeadAccess(user, leadId);
  const agreement = await findLatestAgreementByLeadId(leadId);

  if (!agreement) {
    throw new AppError("Agreement not found", 404, "AGREEMENT_NOT_FOUND");
  }

  return agreement;
}

export async function renderAgreementPdfByLeadId(leadId, user) {
  await assertLeadAccess(user, leadId);
  const agreement = await findLatestAgreementByLeadId(leadId);

  if (!agreement) {
    throw new AppError("Agreement not found", 404, "AGREEMENT_NOT_FOUND");
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
