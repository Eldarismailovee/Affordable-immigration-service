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

export const runRetentionJobsController = asyncHandler(async (req, res) => {
  const summary = await runRetentionJobs({
    categories: req.body.categories,
    limit: req.body.limit,
    dryRun: req.body.dryRun,
    actorUserId: req.user.id,
    actorRole: req.user.role,
    reason: req.body.reason ?? "admin_manual_retention_run",
    request: getAuditContext(req),
  });

  sendResponse(res, retentionRunResponseSchema, summary);
});

export const retentionAdminActionController = asyncHandler(async (req, res) => {
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
      request: getAuditContext(req),
    });
    sendResponse(res, retentionActionResponseSchema, {
      action,
      ...summary,
    });
    return;
  }

  const result = await applyRetentionAdminAction({
    action,
    category,
    targetId,
    retentionUntil: retentionUntil ? new Date(retentionUntil) : undefined,
    scheduledAnonymizationAt: scheduledAnonymizationAt
      ? new Date(scheduledAnonymizationAt)
      : undefined,
    reason,
    actor: req.user,
    request: getAuditContext(req),
  });

  sendResponse(res, retentionActionResponseSchema, result);
});
