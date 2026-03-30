export function createManualPaymentRecord(payload) {
  return {
    success: true,
    paymentMode: "manual",
    email: payload.email || null,
    message: "Manual payment processing placeholder",
  };
}