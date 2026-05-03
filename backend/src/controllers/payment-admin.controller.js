import { updateLeadPaymentStatus } from "../services/payment.service.js";

export async function updatePaymentStatusController(req, res, next) {
  try {
    const { leadId } = req.params;
    const { status } = req.body;
    const payment = await updateLeadPaymentStatus(leadId, status);

    res.json({
      payment,
    });
  } catch (error) {
    next(error);
  }
}
