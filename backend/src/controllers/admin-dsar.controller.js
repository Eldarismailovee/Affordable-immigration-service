import {
  addDsarAdminNote,
  applyDsarAnonymization,
  applyDsarCorrection,
  applyDsarRestriction,
  generateDsarExport,
  getAdminDsarRequest,
  listAdminDsarRequests,
  updateDsarLegalHold,
  updateDsarStatus,
  verifyDsarIdentity,
} from "../services/dsar.service.js";
import {
  adminDsarRequestListResponseSchema,
  adminDsarRequestMutationResponseSchema,
} from "../schemas/responses/dsar.response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const listAdminDsarController = asyncHandler(async (req, res) => {
  const requests = await listAdminDsarRequests(req.user);
  sendResponse(res, adminDsarRequestListResponseSchema, { requests });
});

export const getAdminDsarController = asyncHandler(async (req, res) => {
  const request = await getAdminDsarRequest({
    actor: req.user,
    requestId: req.params.requestId,
  });
  sendResponse(res, adminDsarRequestMutationResponseSchema, { request });
});

export const verifyDsarIdentityController = asyncHandler(async (req, res) => {
  const request = await verifyDsarIdentity({
    actor: req.user,
    requestId: req.params.requestId,
    status: req.body.status,
    notes: req.body.notes,
  });
  sendResponse(res, adminDsarRequestMutationResponseSchema, { request });
});

export const generateDsarExportController = asyncHandler(async (req, res) => {
  const request = await generateDsarExport({
    actor: req.user,
    requestId: req.params.requestId,
  });
  sendResponse(res, adminDsarRequestMutationResponseSchema, { request });
});

export const applyDsarCorrectionController = asyncHandler(async (req, res) => {
  const request = await applyDsarCorrection({
    actor: req.user,
    requestId: req.params.requestId,
    userFields: req.body.userFields,
    leadFields: req.body.leadFields,
    notes: req.body.notes,
  });
  sendResponse(res, adminDsarRequestMutationResponseSchema, { request });
});

export const applyDsarAnonymizationController = asyncHandler(async (req, res) => {
  const request = await applyDsarAnonymization({
    actor: req.user,
    requestId: req.params.requestId,
    notes: req.body.notes,
  });
  sendResponse(res, adminDsarRequestMutationResponseSchema, { request });
});

export const applyDsarRestrictionController = asyncHandler(async (req, res) => {
  const request = await applyDsarRestriction({
    actor: req.user,
    requestId: req.params.requestId,
    notes: req.body.notes,
  });
  sendResponse(res, adminDsarRequestMutationResponseSchema, { request });
});

export const updateDsarLegalHoldController = asyncHandler(async (req, res) => {
  const request = await updateDsarLegalHold({
    actor: req.user,
    requestId: req.params.requestId,
    legalHold: req.body.legalHold,
    reason: req.body.reason,
    notes: req.body.notes,
  });
  sendResponse(res, adminDsarRequestMutationResponseSchema, { request });
});

export const updateDsarStatusController = asyncHandler(async (req, res) => {
  const request = await updateDsarStatus({
    actor: req.user,
    requestId: req.params.requestId,
    status: req.body.status,
    notes: req.body.notes,
  });
  sendResponse(res, adminDsarRequestMutationResponseSchema, { request });
});

export const addDsarNoteController = asyncHandler(async (req, res) => {
  const request = await addDsarAdminNote({
    actor: req.user,
    requestId: req.params.requestId,
    note: req.body.note,
  });
  sendResponse(res, adminDsarRequestMutationResponseSchema, { request });
});
