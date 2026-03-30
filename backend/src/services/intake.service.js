import { randomUUID } from "crypto";
import pool from "../db/pool.js";
import { calculatePricing } from "../utils/pricingCalculator.js";
import { generateAgreement } from "./agreement.service.js";
import { generateOnboardingPacket } from "./onboarding.service.js";

export async function createIntake(payload) {
  const pricing = calculatePricing(payload);
  const agreement = generateAgreement(payload);
  const onboarding = generateOnboardingPacket(payload);

  const leadId = randomUUID();
  const intakeId = randomUUID();
  const agreementId = randomUUID();
  const onboardingId = randomUUID();
  const bookingId = randomUUID();
  const paymentId = randomUUID();
  const docketwiseSyncId = randomUUID();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
      INSERT INTO leads (
        id, first_name, last_name, email, phone, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        leadId,
        payload.firstName,
        payload.lastName,
        payload.email,
        payload.phone,
        "new",
      ]
    );

    await client.query(
      `
      INSERT INTO intakes (
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
        docketwise_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )
      `,
      [
        intakeId,
        leadId,
        payload.selectedPackage,
        payload.caseType,
        payload.notes || "",
        Number(payload.additionalI130Count || 0),
        Boolean(payload.expedited),
        pricing.minTotal,
        pricing.maxTotal,
        "generated",
        "requested",
        "pending_manual_processing",
        "not_synced",
      ]
    );

    await client.query(
      `
      INSERT INTO agreements (
        id, lead_id, title, html_content, status
      ) VALUES ($1, $2, $3, $4, $5)
      `,
      [agreementId, leadId, agreement.agreementTitle, agreement.html, "generated"]
    );

    await client.query(
      `
      INSERT INTO onboarding_packets (
        id, lead_id, title, html_content, status
      ) VALUES ($1, $2, $3, $4, $5)
      `,
      [onboardingId, leadId, onboarding.title, onboarding.html, "generated"]
    );

    await client.query(
      `
      INSERT INTO bookings (
        id, lead_id, consultation_type, preferred_date_time, status
      ) VALUES ($1, $2, $3, $4, $5)
      `,
      [
        bookingId,
        leadId,
        payload.consultationType,
        payload.preferredDateTime,
        "requested",
      ]
    );

    await client.query(
      `
      INSERT INTO payments (
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
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      `,
      [
        paymentId,
        leadId,
        pricing.minTotal,
        pricing.maxTotal,
        "pending_manual_processing",
        true,
        payload.paymentNotes || "Payment to be processed manually by office",
        payload.billingName,
        payload.billingEmail,
        payload.paymentPreference,
        Boolean(payload.consentManualProcessing),
      ]
    );

    await client.query(
      `
      INSERT INTO docketwise_sync (
        id, lead_id, external_id, status, error_message, last_synced_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [docketwiseSyncId, leadId, null, "not_synced", null, null]
    );

    await client.query("COMMIT");

    return {
      id: leadId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      selectedPackage: payload.selectedPackage,
      caseType: payload.caseType,
      notes: payload.notes || "",
      additionalI130Count: Number(payload.additionalI130Count || 0),
      expedited: Boolean(payload.expedited),
      consultationType: payload.consultationType,
      preferredDateTime: payload.preferredDateTime,
      billingName: payload.billingName,
      billingEmail: payload.billingEmail,
      paymentPreference: payload.paymentPreference,
      consentManualProcessing: Boolean(payload.consentManualProcessing),
      paymentNotes: payload.paymentNotes || "",
      pricing,
      agreementStatus: "generated",
      onboardingStatus: "generated",
      bookingStatus: "requested",
      paymentStatus: "pending_manual_processing",
      docketwiseStatus: "not_synced",
      status: "new",
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listLeads() {
  const { rows } = await pool.query(`
    SELECT
      l.id,
      l.first_name,
      l.last_name,
      l.email,
      l.phone,
      l.status,
      l.created_at,
      i.selected_package,
      i.case_type,
      i.agreement_status,
      i.booking_status,
      i.payment_status,
      COALESCE(ds.status, i.docketwise_status) AS docketwise_status,
      ds.external_id AS docketwise_external_id,
      i.pricing_min,
      i.pricing_max,
      op.status AS onboarding_status,
      ag.status AS agreement_document_status
    FROM leads l
    LEFT JOIN LATERAL (
      SELECT *
      FROM intakes i
      WHERE i.lead_id = l.id
      ORDER BY i.created_at DESC
      LIMIT 1
    ) i ON TRUE
    LEFT JOIN LATERAL (
      SELECT *
      FROM onboarding_packets op
      WHERE op.lead_id = l.id
      ORDER BY op.generated_at DESC
      LIMIT 1
    ) op ON TRUE
    LEFT JOIN LATERAL (
      SELECT *
      FROM agreements ag
      WHERE ag.lead_id = l.id
      ORDER BY ag.generated_at DESC
      LIMIT 1
    ) ag ON TRUE
    LEFT JOIN LATERAL (
      SELECT *
      FROM docketwise_sync ds
      WHERE ds.lead_id = l.id
      ORDER BY ds.created_at DESC
      LIMIT 1
    ) ds ON TRUE
    ORDER BY l.created_at DESC
    LIMIT 100
  `);

  return rows;
}
