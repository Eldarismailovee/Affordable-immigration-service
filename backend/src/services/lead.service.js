import { findLeadById } from "../repositories/lead.repository.js";

export async function getLeadById(leadId) {
  return findLeadById(leadId);
}
