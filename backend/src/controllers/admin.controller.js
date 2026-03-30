import { listLeads } from "../services/intake.service.js";
import { getLeadDetail } from "../services/admin.service.js";

export async function listLeadsController(req, res, next) {
  try {
    const leads = await listLeads();
    res.json({ leads });
  } catch (error) {
    next(error);
  }
}

export async function getLeadDetailController(req, res, next) {
  try {
    const { leadId } = req.params;
    const detail = await getLeadDetail(leadId);

    if (!detail) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    res.json(detail);
  } catch (error) {
    next(error);
  }
}
