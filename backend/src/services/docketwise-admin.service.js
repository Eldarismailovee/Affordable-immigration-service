import {
  findLatestDocketwiseSyncByLeadId,
  findLatestIntakeByLeadId,
  findLeadById,
} from "../repositories/lead.repository.js";
import { syncDocketwiseForLead } from "../repositories/docketwise.repository.js";

export async function syncLeadToDocketwise(leadId) {
  const lead = await findLeadById(leadId);

  if (!lead) {
    throw new Error("Lead not found");
  }

  const intake = await findLatestIntakeByLeadId(leadId);

  if (!intake) {
    throw new Error("Intake record not found for this lead");
  }

  const existingSync = await findLatestDocketwiseSyncByLeadId(leadId);

  const externalId = `DW-${leadId.split("-")[0].toUpperCase()}`;
  const now = new Date();

  const syncRow = await syncDocketwiseForLead({
    leadId,
    existingSync,
    externalId,
    lastSyncedAt: now,
  });

  return {
    success: true,
    provider: "Docketwise",
    message: "Lead marked as synced with Docketwise",
    sync: syncRow,
  };
}
