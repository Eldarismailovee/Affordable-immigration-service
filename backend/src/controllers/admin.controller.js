import { listLeads } from "../services/intake.service.js";
import { deleteLead, getLeadDetail } from "../services/admin.service.js";
import {
  leadDetailResponseSchema,
  leadMutationResponseSchema,
  leadsListResponseSchema,
} from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const listLeadsController = asyncHandler(async (req, res) => {
  const leads = await listLeads({ actor: req.user });
  sendResponse(res, leadsListResponseSchema, { leads });
});

export const getLeadDetailController = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const detail = await getLeadDetail({ leadId, actor: req.user });
  sendResponse(res, leadDetailResponseSchema, detail);
});

export const deleteLeadController = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const lead = await deleteLead({ leadId, actor: req.user });
  sendResponse(res, leadMutationResponseSchema, { lead });
});
