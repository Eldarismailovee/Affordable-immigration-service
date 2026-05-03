import { renderOnboardingPdfByLeadId } from "../services/onboarding-document.service.js";

export async function downloadOnboardingPdfController(req, res, next) {
  try {
    const { leadId } = req.params;
    const result = await renderOnboardingPdfByLeadId(leadId);

    if (!result) {
      return res.status(404).json({
        message: "Onboarding packet not found",
      });
    }

    res.status(200);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", result.pdfBuffer.length);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="onboarding-${leadId}.pdf"`
    );

    res.end(result.pdfBuffer);
  } catch (error) {
    next(error);
  }
}
