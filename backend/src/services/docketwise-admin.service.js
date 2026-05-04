import { randomUUID } from "crypto";
import { SYNCED_STATUS } from "../constants/domain.js";
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
import { withUnitOfWork } from "../repositories/unit-of-work.repository.js";
import { AppError } from "../utils/appError.js";
import { assertAdminAccess } from "./access.service.js";

export async function syncLeadToDocketwise({ leadId, actor }) {
  assertAdminAccess(actor);

  const lead = await findLeadById(leadId);

  if (!lead) {
    throw new AppError("Lead not found", 404, "LEAD_NOT_FOUND");
  }

  const intake = await findLatestIntakeByLeadId(leadId);

  if (!intake) {
    throw new AppError("Intake record not found for this lead", 404, "INTAKE_NOT_FOUND");
  }

  const existingSync = await findLatestDocketwiseSyncByLeadId(leadId);

  const externalId = `DW-${leadId.split("-")[0].toUpperCase()}`;
  const now = new Date();

  const syncRow = await withUnitOfWork(async (client) => {
    const nextSync = existingSync
      ? await updateDocketwiseSyncById(
          existingSync.id,
          {
            externalId,
            status: SYNCED_STATUS,
            errorMessage: null,
            lastSyncedAt: now,
          },
          client
        )
      : await createDocketwiseSyncRecord(
          {
            id: randomUUID(),
            leadId,
            externalId,
            status: SYNCED_STATUS,
            errorMessage: null,
            lastSyncedAt: now,
          },
          client
        );

    await updateIntakeDocketwiseStatusByLeadId(leadId, SYNCED_STATUS, client);
    return nextSync;
  });

  return {
    success: true,
    provider: "Docketwise",
    message: "Lead marked as synced with Docketwise",
    sync: syncRow,
  };
}
