import { renderAgreementPdfByLeadId } from "../services/agreement-document.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAuditContext } from "../utils/auditContext.js";
import { sendInlinePdfResponse } from "../utils/sendPdfResponse.js";

export const downloadAgreementPdfController = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const { pdfBuffer } = await renderAgreementPdfByLeadId(
    leadId,
    req.user,
    getAuditContext(req)
  );

  sendInlinePdfResponse(res, {
    pdfBuffer,
    leadId,
    filenamePrefix: "agreement",
  });
});
