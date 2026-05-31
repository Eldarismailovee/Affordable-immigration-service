import { renderAgreementPdfByLeadId } from "../services/agreement-document.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendInlinePdfResponse } from "../utils/sendPdfResponse.js";

export const downloadAgreementPdfController = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const { pdfBuffer } = await renderAgreementPdfByLeadId(leadId, req.user);

  sendInlinePdfResponse(res, {
    pdfBuffer,
    leadId,
    filenamePrefix: "agreement",
  });
});
