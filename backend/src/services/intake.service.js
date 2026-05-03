import { randomUUID } from "crypto";
import { withTransaction } from "../db/transaction.js";
import {
  createBookingRecord,
  createIntakeRecord,
  createLead,
  listLeadSummaries,
} from "../repositories/lead.repository.js";
import { createAgreement } from "../repositories/agreement.repository.js";
import { createOnboardingPacket } from "../repositories/onboarding.repository.js";
import { createPaymentRecord } from "../repositories/payment.repository.js";
import { createDocketwiseSyncRecord } from "../repositories/docketwise.repository.js";
import { calculatePricing } from "../utils/pricingCalculator.js";
import { generateAgreement } from "./agreement.service.js";
import { generateOnboardingPacket } from "./onboarding.service.js";

export async function createIntake(payload, user) {
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

  return withTransaction(async (client) => {
    await createLead(
      {
        id: leadId,
        userId: user?.id || null,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        status: "new",
      },
      client
    );

    await createIntakeRecord(
      {
        id: intakeId,
        leadId,
        selectedPackage: payload.selectedPackage,
        caseType: payload.caseType,
        notes: payload.notes || "",
        additionalI130Count: payload.additionalI130Count,
        expedited: payload.expedited,
        pricingMin: pricing.minTotal,
        pricingMax: pricing.maxTotal,
      },
      client
    );

    await createAgreement(
      {
        id: agreementId,
        leadId,
        title: agreement.agreementTitle,
        htmlContent: agreement.html,
      },
      client
    );

    await createOnboardingPacket(
      {
        id: onboardingId,
        leadId,
        title: onboarding.title,
        htmlContent: onboarding.html,
      },
      client
    );

    await createBookingRecord(
      {
        id: bookingId,
        leadId,
        consultationType: payload.consultationType,
        preferredDateTime: payload.preferredDateTime,
      },
      client
    );

    await createPaymentRecord(
      {
        id: paymentId,
        leadId,
        amountMin: pricing.minTotal,
        amountMax: pricing.maxTotal,
        notes: payload.paymentNotes || "Payment to be processed manually by office",
        billingName: payload.billingName,
        billingEmail: payload.billingEmail,
        paymentPreference: payload.paymentPreference,
        consentManualProcessing: payload.consentManualProcessing,
      },
      client
    );

    await createDocketwiseSyncRecord(
      {
        id: docketwiseSyncId,
        leadId,
      },
      client
    );

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
  });
}

export async function listLeads() {
  return listLeadSummaries();
}
