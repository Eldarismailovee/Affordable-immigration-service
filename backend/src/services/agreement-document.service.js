import { assertPacketApprovedForDownload } from "../domain/packet.policy.js";
import { findLatestAgreementByLeadId } from "../repositories/agreement.repository.js";
import { agreementNotFoundError } from "../domain/errors.js";
import { loadLeadDocument, renderLeadDocumentPdf } from "../utils/leadDocument.js";

export async function getAgreementByLeadId(leadId, user) {
  return loadLeadDocument(
    leadId,
    user,
    findLatestAgreementByLeadId,
    agreementNotFoundError
  );
}

export async function renderAgreementPdfByLeadId(leadId, user) {
  const agreement = await loadLeadDocument(
    leadId,
    user,
    findLatestAgreementByLeadId,
    agreementNotFoundError
  );
  assertPacketApprovedForDownload(agreement);
  const pdfBuffer = await renderLeadDocumentPdf(agreement, "Agreement");

  return {
    agreement,
    pdfBuffer,
  };
}
