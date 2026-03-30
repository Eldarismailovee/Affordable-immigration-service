import pool from "../db/pool.js";

export async function getLeadDetail(leadId) {
  const leadResult = await pool.query(
    `
    SELECT id, first_name, last_name, email, phone, status, created_at, updated_at
    FROM leads
    WHERE id = $1
    LIMIT 1
    `,
    [leadId]
  );

  if (leadResult.rows.length === 0) {
    return null;
  }

  const intakeResult = await pool.query(
    `
    SELECT
      id,
      lead_id,
      selected_package,
      case_type,
      notes,
      additional_i130_count,
      expedited,
      pricing_min,
      pricing_max,
      agreement_status,
      booking_status,
      payment_status,
      docketwise_status,
      submitted_at,
      created_at
    FROM intakes
    WHERE lead_id = $1
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [leadId]
  );

  const agreementResult = await pool.query(
    `
    SELECT
      id,
      lead_id,
      title,
      html_content,
      status,
      generated_at
    FROM agreements
    WHERE lead_id = $1
    ORDER BY generated_at DESC
    LIMIT 1
    `,
    [leadId]
  );

  const onboardingResult = await pool.query(
    `
    SELECT
      id,
      lead_id,
      title,
      html_content,
      status,
      generated_at
    FROM onboarding_packets
    WHERE lead_id = $1
    ORDER BY generated_at DESC
    LIMIT 1
    `,
    [leadId]
  );

  const bookingResult = await pool.query(
    `
    SELECT
      id,
      lead_id,
      consultation_type,
      preferred_date_time,
      status,
      created_at
    FROM bookings
    WHERE lead_id = $1
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [leadId]
  );

  const paymentResult = await pool.query(
    `
    SELECT
      id,
      lead_id,
      amount_min,
      amount_max,
      status,
      manual_review,
      notes,
      billing_name,
      billing_email,
      payment_preference,
      consent_manual_processing,
      created_at,
      updated_at
    FROM payments
    WHERE lead_id = $1
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [leadId]
  );

  const docketwiseResult = await pool.query(
    `
    SELECT
      id,
      lead_id,
      external_id,
      status,
      error_message,
      last_synced_at,
      created_at
    FROM docketwise_sync
    WHERE lead_id = $1
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [leadId]
  );

  return {
    lead: leadResult.rows[0],
    intake: intakeResult.rows[0] || null,
    agreement: agreementResult.rows[0] || null,
    onboarding: onboardingResult.rows[0] || null,
    booking: bookingResult.rows[0] || null,
    payment: paymentResult.rows[0] || null,
    docketwise: docketwiseResult.rows[0] || null,
  };
}
