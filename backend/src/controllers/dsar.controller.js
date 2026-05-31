import {
  createUserDsarRequest,
  getUserDsarExport,
  getUserDsarRequest,
  listUserDsarRequests,
} from "../services/dsar.service.js";
import {
  dsarExportResponseSchema,
  dsarRequestListResponseSchema,
  dsarRequestMutationResponseSchema,
} from "../schemas/responses/dsar.response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const createDsarRequestController = asyncHandler(async (req, res) => {
  const request = await createUserDsarRequest({
    user: req.user,
    type: req.body.type,
    message: req.body.message,
    requestedChanges: req.body.requestedChanges,
  });
  sendResponse(res, dsarRequestMutationResponseSchema, { request }, 201);
});

export const listDsarRequestsController = asyncHandler(async (req, res) => {
  const requests = await listUserDsarRequests(req.user.id);
  sendResponse(res, dsarRequestListResponseSchema, { requests });
});

export const getDsarRequestController = asyncHandler(async (req, res) => {
  const request = await getUserDsarRequest({
    userId: req.user.id,
    requestId: req.params.requestId,
  });
  sendResponse(res, dsarRequestMutationResponseSchema, { request });
});

export const getDsarExportController = asyncHandler(async (req, res) => {
  const data = await getUserDsarExport({
    userId: req.user.id,
    requestId: req.params.requestId,
  });
  sendResponse(res, dsarExportResponseSchema, data);
});
