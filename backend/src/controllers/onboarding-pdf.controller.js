import pool from "../db/pool.js";
import { renderHtmlToPdfBuffer } from "../services/pdf.service.js";

export async function downloadOnboardingPdfController(req, res, next) {
  try {
    const { leadId } = req.params;

    const { rows } = await pool.query(
      `
      SELECT id, lead_id, title, html_content, status, generated_at
      FROM onboarding_packets
      WHERE lead_id = $1
      ORDER BY generated_at DESC
      LIMIT 1
      `,
      [leadId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Onboarding packet not found",
      });
    }

    const packet = rows[0];
    const pdfBuffer = await renderHtmlToPdfBuffer({
      title: packet.title || "Onboarding Packet",
      html: packet.html_content,
    });

    res.status(200);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="onboarding-${leadId}.pdf"`
    );

    res.end(pdfBuffer);
  } catch (error) {
    next(error);
  }
}
