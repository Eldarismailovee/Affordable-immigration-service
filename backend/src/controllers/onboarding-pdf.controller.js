import { renderOnboardingPdfByLeadId } from "../services/onboarding-document.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const downloadOnboardingPdfController = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const result = await renderOnboardingPdfByLeadId(leadId, req.user);

  res.status(200);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", result.pdfBuffer.length);
  res.setHeader(
    "Content-Disposition",
    `inline; filename="onboarding-${leadId}.pdf"`
  );

  res.end(result.pdfBuffer);
});
