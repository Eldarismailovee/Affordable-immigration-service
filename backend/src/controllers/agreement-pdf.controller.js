import { renderAgreementPdfByLeadId } from "../services/agreement-document.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const downloadAgreementPdfController = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const result = await renderAgreementPdfByLeadId(leadId, req.user);

  res.status(200);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", result.pdfBuffer.length);
  res.setHeader(
    "Content-Disposition",
    `inline; filename="agreement-${leadId}.pdf"`
  );

  res.end(result.pdfBuffer);
});
