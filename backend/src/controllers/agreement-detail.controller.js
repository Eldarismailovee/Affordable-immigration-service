import { getAgreementByLeadId } from "../services/agreement-document.service.js";

export async function getAgreementByLeadController(req, res, next) {
  try {
    const { leadId } = req.params;
    const agreement = await getAgreementByLeadId(leadId);

    if (!agreement) {
      return res.status(404).json({
        message: "Agreement not found",
      });
    }

    res.json({ agreement });
  } catch (error) {
    next(error);
  }
}
