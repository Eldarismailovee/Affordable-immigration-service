import { listAccountLeads } from "../services/account.service.js";

export async function listAccountLeadsController(req, res, next) {
  try {
    const leads = await listAccountLeads(req.user.id);
    res.json({ leads });
  } catch (error) {
    next(error);
  }
}
