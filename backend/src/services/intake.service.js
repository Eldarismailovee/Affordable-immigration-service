import { randomUUID } from "crypto";
import { NEW_LEAD_STATUS } from "../constants/domain.js";
import { evaluateJurisdictionAvailability } from "../constants/jurisdictionAvailability.js";
import { createDocketwiseSyncRecord } from "../repositories/docketwise.repository.js";
import { isAttorney } from "../domain/user.policy.js";
import {
  createBookingRecord,
  createIntakeRecord,
  createLead,
  listLeadSummaries,
} from "../repositories/lead.repository.js";
import { createPaymentRecord } from "../repositories/payment.repository.js";
import { withUnitOfWork } from "../repositories/unit-of-work.repository.js";
import { calculatePricing } from "../utils/pricingCalculator.js";
import { buildIntakeResponse } from "../utils/intakeResponse.js";
import { assertProcessingNotRestricted } from "../domain/processing.policy.js";
import { assertStaffAccess } from "./access.service.js";
import { prepareUserPaymentNotes } from "./payment-notes.service.js";
import {
  AUDIT_CATEGORIES,
  AUDIT_EVENT_TYPES,
  AUDIT_RESULTS,
} from "../constants/audit.js";
import { recordAuditEvent } from "./audit.service.js";
import { intakeSubmitMetadata } from "../utils/auditRedaction.js";
import { buildActor } from "../utils/auditContext.js";
import { AppError } from "../utils/appError.js";

async function persistIntakeSubmission({ payload, userId, pricing }) {
  const ids = {
    leadId: randomUUID(),
    intakeId: randomUUID(),
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
        agreementStatus: "previewed",
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
        notes: prepareUserPaymentNotes(payload.paymentNotes),
        notesRedacted: false,
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

function assertIntakeAvailability(payload) {
  const availability = evaluateJurisdictionAvailability({
    matterType: payload.caseType,
    jurisdiction: payload.jurisdiction,
  });

  if (!availability.reviewRequired && !availability.available) {
    throw new AppError(availability.reason, 400, "JURISDICTION_NOT_AVAILABLE");
  }
}

export async function createIntake(payload, user, auditContext = null) {
  if (user) {
    assertProcessingNotRestricted(user);
  }

  assertIntakeAvailability(payload);

  const pricing = calculatePricing(payload);

  const { leadId } = await persistIntakeSubmission({
    payload,
    userId: user?.id || null,
    pricing,
  });

  await recordAuditEvent({
    eventType: AUDIT_EVENT_TYPES.INTAKE_SUBMIT,
    category: AUDIT_CATEGORIES.INTAKE,
    action: "submit",
    result: AUDIT_RESULTS.SUCCESS,
    ...buildActor(user),
    targetType: "lead",
    targetId: leadId,
    request: auditContext,
    metadata: intakeSubmitMetadata(payload),
  });

  await recordAuditEvent({
    eventType: AUDIT_EVENT_TYPES.JURISDICTION_AVAILABILITY_CHECKED,
    category: AUDIT_CATEGORIES.LEAD_WORKFLOW,
    action: "intake_submit",
    result: AUDIT_RESULTS.SUCCESS,
    ...buildActor(user),
    targetType: "lead",
    targetId: leadId,
    metadata: {
      matterType: payload.caseType,
      reviewRequired: true,
    },
  });

  return buildIntakeResponse({ payload, pricing, leadId });
}

export async function listLeads({ actor }) {
  assertStaffAccess(actor);

  if (isAttorney(actor)) {
    return listLeadSummaries({ attorneyVisibleOnly: true });
  }

  return listLeadSummaries();
}
