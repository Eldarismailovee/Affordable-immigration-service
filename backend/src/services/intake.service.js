import { listLeadSummaries } from "../repositories/lead.repository.js";
import { createIntakeSubmission } from "../repositories/intake-submission.repository.js";
import { calculatePricing } from "../utils/pricingCalculator.js";
import { buildIntakeResponse } from "../utils/intakeResponse.js";
import { generateAgreement } from "./agreement.service.js";
import { generateOnboardingPacket } from "./onboarding.service.js";

export async function createIntake(payload, user) {
  const pricing = calculatePricing(payload);
  const agreement = generateAgreement(payload);
  const onboarding = generateOnboardingPacket(payload);

  const { leadId } = await createIntakeSubmission({
    payload,
    userId: user?.id || null,
    pricing,
    agreement,
    onboarding,
  });

  return buildIntakeResponse({ payload, pricing, leadId });
}

export async function listLeads() {
  return listLeadSummaries();
}
