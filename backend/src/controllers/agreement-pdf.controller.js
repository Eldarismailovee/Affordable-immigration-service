import pool from "../db/pool.js";
import { renderHtmlToPdfBuffer } from "../services/pdf.service.js";

export async function downloadAgreementPdfController(req, res, next) {
  try {
    const { leadId } = req.params;

    const { rows } = await pool.query(
      `
      SELECT id, lead_id, title, html_content, status, generated_at
      FROM agreements
      WHERE lead_id = $1
      ORDER BY generated_at DESC
      LIMIT 1
      `,
      [leadId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Agreement not found",
      });
    }

    const agreement = rows[0];
    const pdfBuffer = await renderHtmlToPdfBuffer({
      title: agreement.title || "Agreement",
      html: agreement.html_content,
    });

    res.status(200);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="agreement-${leadId}.pdf"`
    );

    res.end(pdfBuffer);
  } catch (error) {
    next(error);
  }
}
