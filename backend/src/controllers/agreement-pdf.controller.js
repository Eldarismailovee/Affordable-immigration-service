import { renderAgreementPdfByLeadId } from "../services/agreement-document.service.js";

export async function downloadAgreementPdfController(req, res, next) {
  try {
    const { leadId } = req.params;
    const result = await renderAgreementPdfByLeadId(leadId);

    if (!result) {
      return res.status(404).json({
        message: "Agreement not found",
      });
    }

    res.status(200);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", result.pdfBuffer.length);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="agreement-${leadId}.pdf"`
    );

    res.end(result.pdfBuffer);
  } catch (error) {
    next(error);
  }
}
