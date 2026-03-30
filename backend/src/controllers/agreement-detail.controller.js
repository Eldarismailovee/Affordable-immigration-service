import pool from "../db/pool.js";

export async function getAgreementByLeadController(req, res, next) {
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

    res.json({ agreement: rows[0] });
  } catch (error) {
    next(error);
  }
}
