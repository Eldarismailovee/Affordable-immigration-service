import { assertPacketApprovedForDownload } from "../domain/packet.policy.js";
import { findLatestAgreementByLeadId } from "../repositories/agreement.repository.js";
import { agreementNotFoundError } from "../domain/errors.js";
import { loadLeadDocument, renderLeadDocumentPdf } from "../utils/leadDocument.js";
import {
  auditDocumentDownload,
  auditDocumentPdfGenerate,
  auditDocumentView,
} from "../utils/documentAudit.js";

export async function getAgreementByLeadId(leadId, user, auditContext = null) {
  const agreement = await loadLeadDocument(
    leadId,
    user,
    findLatestAgreementByLeadId,
    agreementNotFoundError
  );

  if (auditContext) {
    await auditDocumentView({
      leadId,
      document: agreement,
      documentType: "agreement",
      user,
      auditContext,
    });
  }

  return agreement;
}

export async function renderAgreementPdfByLeadId(leadId, user, auditContext = null) {
  const agreement = await loadLeadDocument(
    leadId,
    user,
    findLatestAgreementByLeadId,
    agreementNotFoundError
  );
  assertPacketApprovedForDownload(agreement);
  const pdfBuffer = await renderLeadDocumentPdf(agreement, "Agreement");

  if (auditContext) {
    await auditDocumentPdfGenerate({
      leadId,
      document: agreement,
      documentType: "agreement",
      user,
      auditContext,
    });
    await auditDocumentDownload({
      leadId,
      document: agreement,
      documentType: "agreement",
      user,
      auditContext,
    });
  }

  return {
    agreement,
    pdfBuffer,
  };
}
