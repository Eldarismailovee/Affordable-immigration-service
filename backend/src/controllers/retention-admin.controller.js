import {
  applyRetentionAdminAction,
  runRetentionJobs,
} from "../services/retention.service.js";
import {
  retentionActionResponseSchema,
  retentionRunResponseSchema,
} from "../schemas/retention.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAuditContext } from "../utils/auditContext.js";
import { sendResponse } from "../utils/sendResponse.js";
import {
  applyIdempotentReplayHeader,
  executeIdempotentHttpCommand,
} from "../utils/idempotentCommand.js";
import { assertAdminAccess } from "../services/access.service.js";

export const runRetentionJobsController = asyncHandler(async (req, res) => {
  const auditContext = getAuditContext(req);

  const result = await executeIdempotentHttpCommand({
    req,
    auditContext,
    actor: req.user,
    authorizeReplay: async () => {
      assertAdminAccess(req.user);
    },
    handler: async () => {
      const summary = await runRetentionJobs({
        categories: req.body.categories,
        limit: req.body.limit,
        dryRun: req.body.dryRun,
        actorUserId: req.user.id,
        actorRole: req.user.role,
        reason: req.body.reason ?? "admin_manual_retention_run",
        request: auditContext,
      });

      return {
        httpStatus: 200,
        responseBody: summary,
        resourceType: "retention_run",
        resourceId: summary.runId ?? null,
      };
    },
  });

  applyIdempotentReplayHeader(res, result.replayed);
  sendResponse(res, retentionRunResponseSchema, result.responseBody, result.httpStatus);
});

export const retentionAdminActionController = asyncHandler(async (req, res) => {
  const auditContext = getAuditContext(req);

  const result = await executeIdempotentHttpCommand({
    req,
    auditContext,
    actor: req.user,
    authorizeReplay: async () => {
      assertAdminAccess(req.user);
    },
    handler: async () => {
      const { action, category, targetId, retentionUntil, scheduledAnonymizationAt, reason } =
        req.body;

      if (action === "run_retention") {
        const summary = await runRetentionJobs({
          categories: req.body.categories,
          limit: req.body.limit ?? 100,
          dryRun: req.body.dryRun ?? true,
          actorUserId: req.user.id,
          actorRole: req.user.role,
          reason,
          request: auditContext,
        });

        return {
          httpStatus: 200,
          responseBody: { action, ...summary },
          resourceType: "retention_run",
          resourceId: summary.runId ?? null,
        };
      }

      const payload = await applyRetentionAdminAction({
        action,
        category,
        targetId,
        retentionUntil: retentionUntil ? new Date(retentionUntil) : undefined,
        scheduledAnonymizationAt: scheduledAnonymizationAt
          ? new Date(scheduledAnonymizationAt)
          : undefined,
        reason,
        actor: req.user,
        request: auditContext,
      });

      return {
        httpStatus: 200,
        responseBody: payload,
        resourceType: "retention_action",
        resourceId: targetId ?? null,
      };
    },
  });

  applyIdempotentReplayHeader(res, result.replayed);
  sendResponse(res, retentionActionResponseSchema, result.responseBody, result.httpStatus);
});
