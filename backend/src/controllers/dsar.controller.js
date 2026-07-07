import {
  createUserDsarRequest,
  getUserDsarExport,
  getUserDsarPdfExport,
  getUserDsarRequest,
  listUserDsarRequests,
} from "../services/dsar.service.js";
import {
  dsarExportResponseSchema,
  dsarRequestListResponseSchema,
  dsarRequestMutationResponseSchema,
} from "../schemas/responses/dsar.response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAuditContext } from "../utils/auditContext.js";
import { sendResponse } from "../utils/sendResponse.js";
import {
  applyIdempotentReplayHeader,
  executeIdempotentHttpCommand,
} from "../utils/idempotentCommand.js";
import { assertAuthenticated } from "../domain/user.policy.js";

export const createDsarRequestController = asyncHandler(async (req, res) => {
  const auditContext = getAuditContext(req);

  const result = await executeIdempotentHttpCommand({
    req,
    auditContext,
    actor: req.user,
    authorizeReplay: async () => {
      assertAuthenticated(req.user);
    },
    handler: async (client) => {
      const request = await createUserDsarRequest({
        user: req.user,
        type: req.body.type,
        message: req.body.message,
        requestedChanges: req.body.requestedChanges,
        auditContext,
        client,
      });

      return {
        httpStatus: 201,
        responseBody: { request },
        resourceType: "dsar_request",
        resourceId: request.id,
      };
    },
  });

  applyIdempotentReplayHeader(res, result.replayed);
  sendResponse(res, dsarRequestMutationResponseSchema, result.responseBody, result.httpStatus);
});

export const listDsarRequestsController = asyncHandler(async (req, res) => {
  const requests = await listUserDsarRequests(req.user);
  sendResponse(res, dsarRequestListResponseSchema, { requests });
});

export const getDsarRequestController = asyncHandler(async (req, res) => {
  const request = await getUserDsarRequest({
    user: req.user,
    requestId: req.params.requestId,
  });
  sendResponse(res, dsarRequestMutationResponseSchema, { request });
});

export const getDsarExportController = asyncHandler(async (req, res) => {
  const data = await getUserDsarExport({
    user: req.user,
    requestId: req.params.requestId,
  });
  sendResponse(res, dsarExportResponseSchema, data);
});

export const getDsarExportPdfController = asyncHandler(async (req, res) => {
  const { pdfBuffer, filename } = await getUserDsarPdfExport({
    user: req.user,
    requestId: req.params.requestId,
  });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.end(pdfBuffer);
});
