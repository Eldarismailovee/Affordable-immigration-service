import { syncLeadToDocketwise } from "../services/docketwise-admin.service.js";

export async function syncLeadToDocketwiseController(req, res, next) {
  try {
    const { leadId } = req.params;
    const result = await syncLeadToDocketwise(leadId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
