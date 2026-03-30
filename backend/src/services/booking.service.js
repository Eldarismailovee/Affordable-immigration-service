export function createBookingRequest(payload) {
  return {
    success: true,
    consultationType: payload.consultationType || "Zoom or phone",
    durationMinutes: 15,
    email: payload.email,
    status: "requested",
  };
}