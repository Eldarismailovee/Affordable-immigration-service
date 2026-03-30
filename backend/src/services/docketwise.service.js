export function createDocketwiseLead(payload) {
  return {
    success: true,
    provider: "Docketwise",
    status: "stub",
    message:
      "Docketwise integration is not connected yet. This is a placeholder response.",
    intakeEmail: payload.email || null,
  };
}