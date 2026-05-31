import {
  addDsarAdminNote,
  applyDsarAnonymization,
  applyDsarCcpaOptOut,
  applyDsarCorrection,
  applyDsarRestriction,
  generateDsarExport,
  generateDsarPdfExport,
  getAdminDsarRequest,
  listAdminDsarRequests,
  resolveDsarObjection,
  updateDsarLegalHold,
  updateDsarStatus,
  verifyDsarIdentity,
} from "../services/dsar.service.js";
import {
  adminDsarRequestListResponseSchema,
  adminDsarRequestMutationResponseSchema,
} from "../schemas/responses/dsar.response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAuditContext } from "../utils/auditContext.js";
import { sendResponse } from "../utils/sendResponse.js";

function withAudit(req, params) {
  return { ...params, auditContext: getAuditContext(req) };
}

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
  const request = await verifyDsarIdentity(
    withAudit(req, {
      actor: req.user,
      requestId: req.params.requestId,
      status: req.body.status,
      notes: req.body.notes,
    })
  );
  sendResponse(res, adminDsarRequestMutationResponseSchema, { request });
});

export const generateDsarExportController = asyncHandler(async (req, res) => {
  const request = await generateDsarExport(
    withAudit(req, {
      actor: req.user,
      requestId: req.params.requestId,
    })
  );
  sendResponse(res, adminDsarRequestMutationResponseSchema, { request });
});

export const generateDsarPdfExportController = asyncHandler(async (req, res) => {
  const request = await generateDsarPdfExport(
    withAudit(req, {
      actor: req.user,
      requestId: req.params.requestId,
    })
  );
  sendResponse(res, adminDsarRequestMutationResponseSchema, { request });
});

export const applyDsarCorrectionController = asyncHandler(async (req, res) => {
  const request = await applyDsarCorrection(
    withAudit(req, {
      actor: req.user,
      requestId: req.params.requestId,
      userFields: req.body.userFields,
      leadFields: req.body.leadFields,
      notes: req.body.notes,
    })
  );
  sendResponse(res, adminDsarRequestMutationResponseSchema, { request });
});

export const applyDsarAnonymizationController = asyncHandler(async (req, res) => {
  const request = await applyDsarAnonymization(
    withAudit(req, {
      actor: req.user,
      requestId: req.params.requestId,
      notes: req.body.notes,
    })
  );
  sendResponse(res, adminDsarRequestMutationResponseSchema, { request });
});

export const applyDsarRestrictionController = asyncHandler(async (req, res) => {
  const request = await applyDsarRestriction(
    withAudit(req, {
      actor: req.user,
      requestId: req.params.requestId,
      notes: req.body.notes,
    })
  );
  sendResponse(res, adminDsarRequestMutationResponseSchema, { request });
});

export const updateDsarLegalHoldController = asyncHandler(async (req, res) => {
  const request = await updateDsarLegalHold(
    withAudit(req, {
      actor: req.user,
      requestId: req.params.requestId,
      legalHold: req.body.legalHold,
      reason: req.body.reason,
      notes: req.body.notes,
    })
  );
  sendResponse(res, adminDsarRequestMutationResponseSchema, { request });
});

export const updateDsarStatusController = asyncHandler(async (req, res) => {
  const request = await updateDsarStatus(
    withAudit(req, {
      actor: req.user,
      requestId: req.params.requestId,
      status: req.body.status,
      notes: req.body.notes,
    })
  );
  sendResponse(res, adminDsarRequestMutationResponseSchema, { request });
});

export const addDsarNoteController = asyncHandler(async (req, res) => {
  const request = await addDsarAdminNote(
    withAudit(req, {
      actor: req.user,
      requestId: req.params.requestId,
      note: req.body.note,
    })
  );
  sendResponse(res, adminDsarRequestMutationResponseSchema, { request });
});

export const resolveDsarObjectionController = asyncHandler(async (req, res) => {
  const request = await resolveDsarObjection(
    withAudit(req, {
      actor: req.user,
      requestId: req.params.requestId,
      accepted: req.body.accepted,
      notes: req.body.notes,
      denialReason: req.body.denialReason,
    })
  );
  sendResponse(res, adminDsarRequestMutationResponseSchema, { request });
});

export const applyDsarCcpaOptOutController = asyncHandler(async (req, res) => {
  const request = await applyDsarCcpaOptOut(
    withAudit(req, {
      actor: req.user,
      requestId: req.params.requestId,
      notes: req.body.notes,
      explanation: req.body.explanation,
    })
  );
  sendResponse(res, adminDsarRequestMutationResponseSchema, { request });
});
