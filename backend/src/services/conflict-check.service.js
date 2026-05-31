import {
  findConflictCheckByLeadId,
  markLegalRecommendationApproved,
  updateAttorneyReviewByLeadId,
  upsertConflictCheck,
} from "../repositories/conflict-check.repository.js";
import {
  findLatestIntakeByLeadId,
  findLeadById,
  updateLeadStateById,
} from "../repositories/lead.repository.js";
import { leadNotFoundError } from "../domain/errors.js";
import {
  assertLeadCanMoveToAttorneyReview,
  assertLeadCanMoveToAccepted,
  assertLeadCanMoveToEngaged,
  ATTORNEY_REVIEW_STATUSES,
  CONFLICT_CHECK_RESULTS,
} from "../domain/lead-workflow.policy.js";
import {
  assertLeadStateTransition,
  isLeadVisibleToAttorney,
} from "../domain/lead-state.policy.js";
import { isAdmin, isAttorney } from "../domain/user.policy.js";
import { AppError } from "../utils/appError.js";
import { assertStaffAccess } from "./access.service.js";
import { updateLeadState } from "./lead-state.service.js";
import {
  AUDIT_CATEGORIES,
  AUDIT_EVENT_TYPES,
  AUDIT_RESULTS,
} from "../constants/audit.js";
import { recordAuditEvent } from "./audit.service.js";
import { buildActor } from "../utils/auditContext.js";
import { textForAdminStorage } from "./payment-notes.service.js";

function assertCanManageWorkflow(actor) {
  assertStaffAccess(actor);

  if (!isAdmin(actor) && !isAttorney(actor)) {
    throw new AppError("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
  }
}

async function loadLeadForWorkflow(leadId, actor) {
  const lead = await findLeadById(leadId);

  if (!lead) {
    throw leadNotFoundError();
  }

  if (isAttorney(actor) && !isAdmin(actor) && !isLeadVisibleToAttorney(lead)) {
    throw new AppError("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
  }

  return lead;
}

export async function getConflictCheckForLead({ leadId, actor }) {
  assertCanManageWorkflow(actor);
  await loadLeadForWorkflow(leadId, actor);
  return findConflictCheckByLeadId(leadId);
}

export async function submitConflictCheck({ leadId, actor, payload }) {
  assertCanManageWorkflow(actor);

  const lead = await loadLeadForWorkflow(leadId, actor);
  const intake = await findLatestIntakeByLeadId(leadId);

  const conflictCheck = await upsertConflictCheck({
    leadId,
    potentialClientName: `${lead.first_name} ${lead.last_name}`.trim(),
    potentialClientEmail: lead.email,
    opposingPartyNames: payload.opposingPartyNames,
    relatedPersonNames: payload.relatedPersonNames,
    matterType: payload.matterType || intake?.case_type || "Unknown",
    jurisdictionOrLocation: payload.jurisdiction,
    caseSummary: payload.caseSummary,
    notes: payload.notes ? textForAdminStorage(payload.notes) : null,
    result: CONFLICT_CHECK_RESULTS.PENDING,
    submittedAt: new Date(),
  });

  let updatedLead = lead;

  if (lead.status === "new") {
    updatedLead = await updateLeadState({ leadId, state: "conflict_check", actor });
  }

  await recordAuditEvent({
    eventType: AUDIT_EVENT_TYPES.LEAD_CONFLICT_CHECK_UPDATED,
    category: AUDIT_CATEGORIES.LEAD_WORKFLOW,
    action: "submit",
    result: AUDIT_RESULTS.SUCCESS,
    ...buildActor(actor),
    targetType: "lead",
    targetId: leadId,
    metadata: {
      result: conflictCheck.result,
      matterType: conflictCheck.matter_type,
    },
  });

  return { lead: updatedLead, conflictCheck };
}

export async function updateConflictCheck({ leadId, actor, payload }) {
  assertCanManageWorkflow(actor);

  const lead = await loadLeadForWorkflow(leadId, actor);
  const existing = await findConflictCheckByLeadId(leadId);
  const intake = await findLatestIntakeByLeadId(leadId);

  if (!existing) {
    throw new AppError("Conflict check not found", 404, "CONFLICT_CHECK_NOT_FOUND");
  }

  const nextResult = payload.result ?? existing.result;
  const reviewedAt =
    payload.result && payload.result !== CONFLICT_CHECK_RESULTS.PENDING ? new Date() : existing.reviewed_at;
  const reviewedBy =
    payload.result && payload.result !== CONFLICT_CHECK_RESULTS.PENDING ? actor.id : existing.reviewed_by;

  const conflictCheck = await upsertConflictCheck({
    leadId,
    potentialClientName: existing.potential_client_name,
    potentialClientEmail: existing.potential_client_email,
    opposingPartyNames: payload.opposingPartyNames ?? existing.opposing_party_names,
    relatedPersonNames: payload.relatedPersonNames ?? existing.related_person_names,
    matterType: payload.matterType ?? existing.matter_type,
    jurisdictionOrLocation: payload.jurisdiction ?? existing.jurisdiction_or_location,
    caseSummary: payload.caseSummary ?? existing.case_summary,
    notes: payload.notes !== undefined ? textForAdminStorage(payload.notes) : existing.notes,
    result: nextResult,
    submittedAt: existing.submitted_at,
    reviewedBy,
    reviewedAt,
  });

  let updatedLead = lead;

  if (nextResult === CONFLICT_CHECK_RESULTS.CLEAR && lead.status === "conflict_check") {
    assertLeadCanMoveToAttorneyReview(conflictCheck);
    updatedLead = await updateLeadState({ leadId, state: "attorney_review", actor });
  }

  if (nextResult === CONFLICT_CHECK_RESULTS.CONFLICT_FOUND && lead.status !== "declined") {
    assertLeadStateTransition(lead.status, "declined");
    updatedLead = await updateLeadStateById(leadId, "declined");
  }

  await recordAuditEvent({
    eventType: AUDIT_EVENT_TYPES.LEAD_CONFLICT_CHECK_UPDATED,
    category: AUDIT_CATEGORIES.LEAD_WORKFLOW,
    action: "update",
    result: AUDIT_RESULTS.SUCCESS,
    ...buildActor(actor),
    targetType: "lead",
    targetId: leadId,
    metadata: {
      oldResult: existing.result,
      result: conflictCheck.result,
    },
  });

  return { lead: updatedLead, conflictCheck };
}

export async function submitAttorneyReview({ leadId, actor, payload }) {
  assertCanManageWorkflow(actor);

  if (!isAttorney(actor) && !isAdmin(actor)) {
    throw new AppError("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
  }

  const lead = await loadLeadForWorkflow(leadId, actor);
  const conflictCheck = await findConflictCheckByLeadId(leadId);
  const intake = await findLatestIntakeByLeadId(leadId);

  if (!conflictCheck) {
    throw new AppError("Conflict check required before attorney review", 400, "CONFLICT_CHECK_REQUIRED");
  }

  assertLeadCanMoveToAttorneyReview(conflictCheck);

  const reviewStatus =
    payload.decision === "accepted"
      ? ATTORNEY_REVIEW_STATUSES.ACCEPTED
      : ATTORNEY_REVIEW_STATUSES.DECLINED;

  const updatedLead = await updateAttorneyReviewByLeadId({
    leadId,
    status: reviewStatus,
    reviewedBy: actor.id,
    reviewNotes: payload.reviewNotes ? textForAdminStorage(payload.reviewNotes) : null,
    responsibleAttorneyConfirmed: Boolean(payload.confirmResponsibleAttorney),
  });

  let nextLead = updatedLead;

  if (payload.decision === "accepted") {
    assertLeadCanMoveToAccepted(updatedLead, intake, conflictCheck.jurisdiction_or_location);
    nextLead = await updateLeadState({ leadId, state: "accepted", actor });
  } else {
    nextLead = await updateLeadState({ leadId, state: "declined", actor });
  }

  await recordAuditEvent({
    eventType:
      payload.decision === "accepted"
        ? AUDIT_EVENT_TYPES.LEAD_ATTORNEY_REVIEW_ACCEPTED
        : AUDIT_EVENT_TYPES.LEAD_ATTORNEY_REVIEW_DECLINED,
    category: AUDIT_CATEGORIES.LEAD_WORKFLOW,
    action: payload.decision,
    result: AUDIT_RESULTS.SUCCESS,
    ...buildActor(actor),
    targetType: "lead",
    targetId: leadId,
    metadata: {
      reviewStatus,
    },
  });

  return { lead: nextLead, conflictCheck };
}

export async function approveLegalRecommendation({ leadId, actor, reviewNotes }) {
  assertCanManageWorkflow(actor);

  if (!isAttorney(actor) && !isAdmin(actor)) {
    throw new AppError("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
  }

  const lead = await loadLeadForWorkflow(leadId, actor);
  const intake = await findLatestIntakeByLeadId(leadId);

  if (!intake) {
    throw new AppError("Intake not found", 404, "INTAKE_NOT_FOUND");
  }

  await markLegalRecommendationApproved({ leadId, approvedBy: actor.id });

  await recordAuditEvent({
    eventType: AUDIT_EVENT_TYPES.LEGAL_RECOMMENDATION_ATTORNEY_APPROVED,
    category: AUDIT_CATEGORIES.LEAD_WORKFLOW,
    action: "approve",
    result: AUDIT_RESULTS.SUCCESS,
    ...buildActor(actor),
    targetType: "lead",
    targetId: leadId,
    metadata: {
      reviewNotes: reviewNotes ? "provided" : null,
      leadStatus: lead.status,
    },
  });

  return findLatestIntakeByLeadId(leadId);
}

export async function enrichLeadWithWorkflow(lead) {
  const conflictCheck = await findConflictCheckByLeadId(lead.id);

  return {
    ...lead,
    conflict_check_result: conflictCheck?.result ?? null,
  };
}

export async function moveLeadToEngaged({ leadId, actor }) {
  const lead = await loadLeadForWorkflow(leadId, actor);
  const conflictCheck = await findConflictCheckByLeadId(leadId);
  const enrichedLead = {
    ...lead,
    conflict_check_result: conflictCheck?.result ?? null,
  };

  assertLeadCanMoveToEngaged(enrichedLead);
  return updateLeadState({ leadId, state: "engaged", actor });
}
