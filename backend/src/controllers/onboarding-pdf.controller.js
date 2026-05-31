import { renderOnboardingPdfByLeadId } from "../services/onboarding-document.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendInlinePdfResponse } from "../utils/sendPdfResponse.js";

export const downloadOnboardingPdfController = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const { pdfBuffer } = await renderOnboardingPdfByLeadId(leadId, req.user);

  sendInlinePdfResponse(res, {
    pdfBuffer,
    leadId,
    filenamePrefix: "onboarding",
  });
});
