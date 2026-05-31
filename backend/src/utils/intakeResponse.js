import {
  DRAFT_PACKET_STATUS,
  NEW_LEAD_STATUS,
  NOT_SYNCED_STATUS,
  PENDING_PAYMENT_STATUS,
  REQUESTED_BOOKING_STATUS,
} from "../constants/domain.js";

export function buildIntakeResponse({ payload, pricing, leadId }) {
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
    onboardingStatus: DRAFT_PACKET_STATUS,
    bookingStatus: REQUESTED_BOOKING_STATUS,
    paymentStatus: PENDING_PAYMENT_STATUS,
    docketwiseStatus: NOT_SYNCED_STATUS,
    status: NEW_LEAD_STATUS,
    createdAt: new Date().toISOString(),
  };
}
