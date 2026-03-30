import pool from "../db/pool.js";

export async function getOnboardingPacketController(req, res, next) {
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

    res.json({ onboarding: rows[0] });
  } catch (error) {
    next(error);
  }
}