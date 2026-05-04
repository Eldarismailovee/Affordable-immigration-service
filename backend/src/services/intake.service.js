import { randomUUID } from "crypto";
import { NEW_LEAD_STATUS } from "../constants/domain.js";
import { createAgreement } from "../repositories/agreement.repository.js";
import { createDocketwiseSyncRecord } from "../repositories/docketwise.repository.js";
import {
  createBookingRecord,
  createIntakeRecord,
  createLead,
  listLeadSummaries,
} from "../repositories/lead.repository.js";
import { createOnboardingPacket } from "../repositories/onboarding.repository.js";
import { createPaymentRecord } from "../repositories/payment.repository.js";
import { withUnitOfWork } from "../repositories/unit-of-work.repository.js";
import { calculatePricing } from "../utils/pricingCalculator.js";
import { buildIntakeResponse } from "../utils/intakeResponse.js";
import { generateAgreement } from "./agreement.service.js";
import { assertAdminAccess } from "./access.service.js";
import { generateOnboardingPacket } from "./onboarding.service.js";

const DEFAULT_PAYMENT_NOTE = "Payment to be processed manually by office";

async function persistIntakeSubmission({ payload, userId, pricing, agreement, onboarding }) {
  const ids = {
    leadId: randomUUID(),
    intakeId: randomUUID(),
    agreementId: randomUUID(),
    onboardingId: randomUUID(),
    bookingId: randomUUID(),
    paymentId: randomUUID(),
    docketwiseSyncId: randomUUID(),
  };

  await withUnitOfWork(async (client) => {
    await createLead(
      {
        id: ids.leadId,
        userId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        status: NEW_LEAD_STATUS,
      },
      client
    );

    await createIntakeRecord(
      {
        id: ids.intakeId,
        leadId: ids.leadId,
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
        id: ids.agreementId,
        leadId: ids.leadId,
        title: agreement.agreementTitle,
        htmlContent: agreement.html,
      },
      client
    );

    await createOnboardingPacket(
      {
        id: ids.onboardingId,
        leadId: ids.leadId,
        title: onboarding.title,
        htmlContent: onboarding.html,
      },
      client
    );

    await createBookingRecord(
      {
        id: ids.bookingId,
        leadId: ids.leadId,
        consultationType: payload.consultationType,
        preferredDateTime: payload.preferredDateTime,
      },
      client
    );

    await createPaymentRecord(
      {
        id: ids.paymentId,
        leadId: ids.leadId,
        amountMin: pricing.minTotal,
        amountMax: pricing.maxTotal,
        notes: payload.paymentNotes || DEFAULT_PAYMENT_NOTE,
        billingName: payload.billingName,
        billingEmail: payload.billingEmail,
        paymentPreference: payload.paymentPreference,
        consentManualProcessing: payload.consentManualProcessing,
      },
      client
    );

    await createDocketwiseSyncRecord(
      {
        id: ids.docketwiseSyncId,
        leadId: ids.leadId,
      },
      client
    );
  });

  return ids;
}

export async function createIntake(payload, user) {
  const pricing = calculatePricing(payload);
  const agreement = generateAgreement(payload);
  const onboarding = generateOnboardingPacket(payload);

  const { leadId } = await persistIntakeSubmission({
    payload,
    userId: user?.id || null,
    pricing,
    agreement,
    onboarding,
  });

  return buildIntakeResponse({ payload, pricing, leadId });
}

export async function listLeads({ actor }) {
  assertAdminAccess(actor);
  return listLeadSummaries();
}
