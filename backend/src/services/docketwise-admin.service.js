import { randomUUID } from "crypto";
import {
  findLatestDocketwiseSyncByLeadId,
  findLatestIntakeByLeadId,
  findLeadById,
  updateIntakeDocketwiseStatusByLeadId,
} from "../repositories/lead.repository.js";
import {
  createDocketwiseSyncRecord,
  updateDocketwiseSyncById,
} from "../repositories/docketwise.repository.js";
import { withTransaction } from "../db/transaction.js";

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

  return withTransaction(async (client) => {
    let syncRow;

    if (existingSync) {
      syncRow = await updateDocketwiseSyncById(
        existingSync.id,
        {
          externalId,
          status: "synced",
          errorMessage: null,
          lastSyncedAt: now,
        },
        client
      );
    } else {
      syncRow = await createDocketwiseSyncRecord(
        {
          id: randomUUID(),
          leadId,
          externalId,
          status: "synced",
          errorMessage: null,
          lastSyncedAt: now,
        },
        client
      );
    }

    await updateIntakeDocketwiseStatusByLeadId(leadId, "synced", client);

    return {
      success: true,
      provider: "Docketwise",
      message: "Lead marked as synced with Docketwise",
      sync: syncRow,
    };
  });
}
