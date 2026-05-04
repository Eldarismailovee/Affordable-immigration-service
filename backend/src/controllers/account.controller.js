import { listAccountLeads } from "../services/account.service.js";
import { leadsListResponseSchema } from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const listAccountLeadsController = asyncHandler(async (req, res) => {
  const leads = await listAccountLeads(req.user.id);
  sendResponse(res, leadsListResponseSchema, { leads });
});
