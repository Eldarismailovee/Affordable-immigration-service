import { randomUUID } from "crypto";
import pg from "pg";
import dotenv from "dotenv";
import { calculatePricing } from "../src/utils/pricingCalculator.js";
import { generateAgreement } from "../src/services/agreement.service.js";
import { generateOnboardingPacket } from "../src/services/onboarding.service.js";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const demoLeads = [
  {
    firstName: "Arina",
    lastName: "Santos",
    email: "arina.demo@example.com",
    phone: "(555) 100-1000",
    selectedPackage: "filing",
    caseType: "Marriage-based green card",
    notes: "Seeded demo lead",
    additionalI130Count: 1,
    expedited: false,
    consultationType: "Zoom",
    preferredDateTime: "2026-04-03 10:00",
    billingName: "Arina Santos",
    billingEmail: "billing.arina@example.com",
    paymentPreference: "invoice",
    consentManualProcessing: true,
    paymentNotes: "Invoice after consultation",
    paymentStatus: "invoice_sent",
    docketwiseStatus: "synced",
  },
  {
    firstName: "Daniel",
    lastName: "Lopez",
    email: "daniel.demo@example.com",
    phone: "(555) 100-2000",
    selectedPackage: "guidance",
    caseType: "Parent petition",
    notes: "Seeded demo lead",
    additionalI130Count: 0,
    expedited: true,
    consultationType: "Phone",
    preferredDateTime: "2026-04-04 11:30",
    billingName: "Daniel Lopez",
    billingEmail: "billing.daniel@example.com",
    paymentPreference: "office_call",
    consentManualProcessing: true,
    paymentNotes: "Call to coordinate payment",
    paymentStatus: "payment_requested",
    docketwiseStatus: "not_synced",
  },
];

async function ensureSiteSettings(client) {
  const existing = await client.query("SELECT id FROM site_settings LIMIT 1");
  if (existing.rows.length > 0) return;

  await client.query(
    `
    INSERT INTO site_settings (
      id, firm_name, phone, email, office_mode, address,
      logo_url, hero_image_url, services_image_url, office_image_url, language_mode, updated_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()
    )
    `,
    [
      randomUUID(),
      "Immigration Law Firm",
      "(555) 123-4567",
      "info@immigrationfirm.com",
      "Zoom / phone only",
      "",
      "/images/logo.png",
      "/images/la-skyline.jpg",
      "/images/family-immigration.jpg",
      "/images/ny-office.jpg",
      "english",
    ]
  );
}

async function insertLead(client, payload) {
  const leadId = randomUUID();
  const intakeId = randomUUID();
  const agreementId = randomUUID();
  const onboardingId = randomUUID();
  const bookingId = randomUUID();
  const paymentId = randomUUID();
  const docketwiseId = randomUUID();

  const pricing = calculatePricing(payload);
  const agreement = generateAgreement(payload);
  const onboarding = generateOnboardingPacket(payload);

  await client.query(
    `INSERT INTO leads (id, first_name, last_name, email, phone, status)
     VALUES ($1,$2,$3,$4,$5,'new')`,
    [leadId, payload.firstName, payload.lastName, payload.email, payload.phone]
  );

  await client.query(
    `INSERT INTO intakes (
      id, lead_id, selected_package, case_type, notes, additional_i130_count, expedited,
      pricing_min, pricing_max, agreement_status, booking_status, payment_status, docketwise_status
     ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,'generated','requested',$10,$11
     )`,
    [
      intakeId,
      leadId,
      payload.selectedPackage,
      payload.caseType,
      payload.notes,
      payload.additionalI130Count,
      payload.expedited,
      pricing.minTotal,
      pricing.maxTotal,
      payload.paymentStatus,
      payload.docketwiseStatus,
    ]
  );

  await client.query(
    `INSERT INTO agreements (id, lead_id, title, html_content, status)
     VALUES ($1,$2,$3,$4,'generated')`,
    [agreementId, leadId, agreement.agreementTitle, agreement.html]
  );

  await client.query(
    `INSERT INTO onboarding_packets (id, lead_id, title, html_content, status)
     VALUES ($1,$2,$3,$4,'generated')`,
    [onboardingId, leadId, onboarding.title, onboarding.html]
  );

  await client.query(
    `INSERT INTO bookings (id, lead_id, consultation_type, preferred_date_time, status)
     VALUES ($1,$2,$3,$4,'requested')`,
    [bookingId, leadId, payload.consultationType, payload.preferredDateTime]
  );

  await client.query(
    `INSERT INTO payments (
      id, lead_id, amount_min, amount_max, status, manual_review, notes,
      billing_name, billing_email, payment_preference, consent_manual_processing, updated_at
     ) VALUES ($1,$2,$3,$4,$5,true,$6,$7,$8,$9,$10,NOW())`,
    [
      paymentId,
      leadId,
      pricing.minTotal,
      pricing.maxTotal,
      payload.paymentStatus,
      payload.paymentNotes,
      payload.billingName,
      payload.billingEmail,
      payload.paymentPreference,
      payload.consentManualProcessing,
    ]
  );

  await client.query(
    `INSERT INTO docketwise_sync (
      id, lead_id, external_id, status, error_message, last_synced_at
     ) VALUES ($1,$2,$3,$4,NULL,NOW())`,
    [
      docketwiseId,
      leadId,
      payload.docketwiseStatus === "synced" ? `DW-${leadId.slice(0, 8).toUpperCase()}` : null,
      payload.docketwiseStatus,
    ]
  );

  return leadId;
}

async function main() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await ensureSiteSettings(client);

    const ids = [];
    for (const lead of demoLeads) {
      ids.push(await insertLead(client, lead));
    }

    await client.query("COMMIT");
    console.log("Seeded demo data for leads:", ids.join(", "));
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
