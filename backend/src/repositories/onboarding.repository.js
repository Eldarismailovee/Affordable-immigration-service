import pool from "../db/pool.js";

export async function findLatestOnboardingPacketByLeadId(leadId, db = pool) {
  const { rows } = await db.query(
    `
    SELECT id, lead_id, title, html_content, status, generated_at
    FROM onboarding_packets
    WHERE lead_id = $1
    ORDER BY generated_at DESC
    LIMIT 1
    `,
    [leadId]
  );

  return rows[0] || null;
}

export async function createOnboardingPacket(
  {
    id,
    leadId,
    title,
    htmlContent,
    status = "generated",
  },
  db = pool
) {
  await db.query(
    `
    INSERT INTO onboarding_packets (
      id, lead_id, title, html_content, status
    ) VALUES ($1, $2, $3, $4, $5)
    `,
    [id, leadId, title, htmlContent, status]
  );
}
