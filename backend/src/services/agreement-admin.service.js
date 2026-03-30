import { randomUUID } from "crypto";
import pool from "../db/pool.js";
import { generateAgreement } from "./agreement.service.js";

export async function generateAgreementForLead(leadId) {
  const client = await pool.connect();

  try {
    const leadResult = await client.query(
      `
      SELECT id, first_name, last_name, email, phone
      FROM leads
      WHERE id = $1
      LIMIT 1
      `,
      [leadId]
    );

    if (leadResult.rows.length === 0) {
      throw new Error("Lead not found");
    }

    const intakeResult = await client.query(
      `
      SELECT
        selected_package,
        case_type,
        notes,
        additional_i130_count,
        expedited
      FROM intakes
      WHERE lead_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [leadId]
    );

    if (intakeResult.rows.length === 0) {
      throw new Error("Intake record not found for this lead");
    }

    const existingAgreement = await client.query(
      `
      SELECT id, lead_id, title, html_content, status, generated_at
      FROM agreements
      WHERE lead_id = $1
      ORDER BY generated_at DESC
      LIMIT 1
      `,
      [leadId]
    );

    if (existingAgreement.rows.length > 0) {
      return {
        alreadyExists: true,
        agreement: existingAgreement.rows[0],
      };
    }

    const lead = leadResult.rows[0];
    const intake = intakeResult.rows[0];

    const payload = {
      firstName: lead.first_name,
      lastName: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      selectedPackage: intake.selected_package,
      caseType: intake.case_type,
      notes: intake.notes || "",
      additionalI130Count: Number(intake.additional_i130_count || 0),
      expedited: Boolean(intake.expedited),
    };

    const agreement = generateAgreement(payload);
    const agreementId = randomUUID();

    const insertResult = await client.query(
      `
      INSERT INTO agreements (
        id, lead_id, title, html_content, status
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, lead_id, title, html_content, status, generated_at
      `,
      [agreementId, leadId, agreement.agreementTitle, agreement.html, "generated"]
    );

    await client.query(
      `
      UPDATE intakes
      SET agreement_status = 'generated'
      WHERE lead_id = $1
      `,
      [leadId]
    );

    return {
      alreadyExists: false,
      agreement: insertResult.rows[0],
    };
  } finally {
    client.release();
  }
}
