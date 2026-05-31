export function sendInlinePdfResponse(res, { pdfBuffer, leadId, filenamePrefix }) {
  res.status(200);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", pdfBuffer.length);
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${filenamePrefix}-${leadId}.pdf"`
  );
  res.end(pdfBuffer);
}
