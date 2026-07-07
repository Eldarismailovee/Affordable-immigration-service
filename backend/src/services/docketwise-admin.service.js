import { randomUUID } from "crypto";
import { NOT_CONFIGURED_STATUS } from "../constants/domain.js";
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
import { intakeNotFoundError, leadNotFoundError } from "../domain/errors.js";
import { assertAdminAccess } from "./access.service.js";
import env from "../config/env.js";

const INTEGRATION_MESSAGE =
  "Docketwise integration is not configured; no provider sync was performed";

function isDocketwiseConfigured() {
  return Boolean(env.DOCKETWISE_API_URL && env.DOCKETWISE_API_TOKEN);
}

export async function syncLeadToDocketwise({ leadId, actor, client = null }) {
  assertAdminAccess(actor);

  const lead = await findLeadById(leadId);

  if (!lead) {
    throw leadNotFoundError();
  }

  const intake = await findLatestIntakeByLeadId(leadId);

  if (!intake) {
    throw intakeNotFoundError();
  }

  if (!isDocketwiseConfigured()) {
    const existingSync = await findLatestDocketwiseSyncByLeadId(leadId);

    const run = client
      ? async (callback) => callback(client)
      : async (callback) => withUnitOfWork(callback);

    const syncRow = await run(async (txClient) => {
      const nextSync = existingSync
        ? await updateDocketwiseSyncById(
            existingSync.id,
            {
              externalId: null,
              status: NOT_CONFIGURED_STATUS,
              errorMessage: INTEGRATION_MESSAGE,
              lastSyncedAt: null,
            },
            txClient
          )
        : await createDocketwiseSyncRecord(
            {
              id: randomUUID(),
              leadId,
              externalId: null,
              status: NOT_CONFIGURED_STATUS,
              errorMessage: INTEGRATION_MESSAGE,
              lastSyncedAt: null,
            },
            txClient
          );

      await updateIntakeDocketwiseStatusByLeadId(leadId, NOT_CONFIGURED_STATUS, txClient);
      return nextSync;
    });

    return {
      success: false,
      provider: "Docketwise",
      configured: false,
      message: INTEGRATION_MESSAGE,
      sync: syncRow,
    };
  }

  return {
    success: false,
    provider: "Docketwise",
    configured: true,
    message: "Docketwise provider adapter is not implemented yet",
    sync: await findLatestDocketwiseSyncByLeadId(leadId),
  };
}
