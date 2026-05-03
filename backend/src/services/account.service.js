import { listLeadSummaries } from "../repositories/lead.repository.js";

export async function listAccountLeads(userId) {
  return listLeadSummaries({ userId });
}
