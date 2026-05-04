import { listAccountLeads } from "../services/account.service.js";
import { leadsListResponseSchema } from "../schemas/response.schema.js";
import { sendResponse } from "../utils/sendResponse.js";

export async function listAccountLeadsController(req, res, next) {
  try {
    const leads = await listAccountLeads(req.user.id);
    sendResponse(res, leadsListResponseSchema, { leads });
  } catch (error) {
    next(error);
  }
}
