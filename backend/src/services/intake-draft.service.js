import {
  deleteIntakeDraftForUser,
  findIntakeDraftByUserId,
  markIntakeDraftSubmitted,
  upsertIntakeDraft,
} from "../repositories/intake-draft.repository.js";
import { AppError } from "../utils/appError.js";

function toResponse(draft) {
  return {
    data: draft.data,
    version: draft.version,
    updatedAt: new Date(draft.updatedAt).toISOString(),
    expiresAt: new Date(draft.expiresAt).toISOString(),
  };
}

export async function getIntakeDraftForUser(userId) {
  const draft = await findIntakeDraftByUserId(userId);

  if (!draft) {
    return null;
  }

  return toResponse(draft);
}

export async function saveIntakeDraftForUser(userId, { data, version = null }) {
  const result = await upsertIntakeDraft({
    userId,
    data,
    expectedVersion: version,
  });

  if (result.conflict) {
    throw new AppError("Draft version conflict", 409, "INTAKE_DRAFT_VERSION_CONFLICT");
  }

  return toResponse(result.draft);
}

export async function removeIntakeDraftForUser(userId) {
  await deleteIntakeDraftForUser(userId);
}

export async function closeIntakeDraftAfterSubmit(userId, client) {
  await markIntakeDraftSubmitted(userId, client);
}
