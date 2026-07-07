import {
  getIntakeDraftForUser,
  removeIntakeDraftForUser,
  saveIntakeDraftForUser,
} from "../services/intake-draft.service.js";
import { intakeDraftResponseSchema } from "../schemas/intake-draft.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const getIntakeDraftController = asyncHandler(async (req, res) => {
  const draft = await getIntakeDraftForUser(req.user.id);

  if (!draft) {
    return res.status(204).end();
  }

  sendResponse(res, intakeDraftResponseSchema, draft);
});

export const upsertIntakeDraftController = asyncHandler(async (req, res) => {
  const draft = await saveIntakeDraftForUser(req.user.id, req.body);
  sendResponse(res, intakeDraftResponseSchema, draft);
});

export const deleteIntakeDraftController = asyncHandler(async (req, res) => {
  await removeIntakeDraftForUser(req.user.id);
  res.status(204).end();
});
