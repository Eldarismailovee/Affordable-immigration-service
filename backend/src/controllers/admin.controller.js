import { listLeads } from "../services/intake.service.js";
import { deleteLead, getLeadDetail } from "../services/admin.service.js";
import {
  leadDetailResponseSchema,
  leadMutationResponseSchema,
  leadsListResponseSchema,
} from "../schemas/response.schema.js";
import { sendResponse } from "../utils/sendResponse.js";

export async function listLeadsController(req, res, next) {
  try {
    const leads = await listLeads();
    sendResponse(res, leadsListResponseSchema, { leads });
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

    sendResponse(res, leadDetailResponseSchema, detail);
  } catch (error) {
    next(error);
  }
}

export async function deleteLeadController(req, res, next) {
  try {
    const { leadId } = req.params;
    const lead = await deleteLead(leadId);
    sendResponse(res, leadMutationResponseSchema, { lead });
  } catch (error) {
    next(error);
  }
}
