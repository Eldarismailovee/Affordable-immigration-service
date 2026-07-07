import env from "../config/env.js";

export function createBookingRequest(payload) {
  return {
    success: false,
    configured: false,
    consultationType: payload.consultationType || "Zoom or phone",
    durationMinutes: 15,
    email: payload.email,
    status: "not_configured",
    message: "Booking provider is not configured; no appointment was persisted",
  };
}

export function isBookingProviderConfigured() {
  return Boolean(env.BOOKING_PROVIDER_CONFIGURED);
}
