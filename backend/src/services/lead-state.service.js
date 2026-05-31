import {
  findLeadById,
  findLatestIntakeByLeadId,
  updateLeadStateById,
} from "../repositories/lead.repository.js";
import { findConflictCheckByLeadId } from "../repositories/conflict-check.repository.js";
import { leadNotFoundError } from "../domain/errors.js";
import {
  assertLeadCanMoveToAccepted,
  assertLeadCanMoveToAttorneyReview,
  assertLeadCanMoveToEngaged,
} from "../domain/lead-workflow.policy.js";
import {
  assertLeadStateTransition,
  isLeadVisibleToAttorney,
} from "../domain/lead-state.policy.js";
import { isAdmin, isAttorney } from "../domain/user.policy.js";
import { AppError } from "../utils/appError.js";
import { assertStaffAccess } from "./access.service.js";
import {
  AUDIT_CATEGORIES,
  AUDIT_EVENT_TYPES,
  AUDIT_RESULTS,
} from "../constants/audit.js";
import { recordAuditEvent } from "./audit.service.js";
import { buildActor } from "../utils/auditContext.js";

function assertCanTransitionLeadState({ actor, fromState, toState }) {
  assertLeadStateTransition(fromState, toState);

  if (isAdmin(actor)) {
    return;
  }

  if (!isAttorney(actor)) {
    throw new AppError("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
  }

  const attorneyAllowed = {
    conflict_check: ["attorney_review", "declined"],
    attorney_review: ["accepted", "declined"],
    accepted: ["engaged", "declined"],
    engaged: ["filed"],
  };

  const allowed = attorneyAllowed[fromState] || [];

  if (!allowed.includes(toState)) {
    throw new AppError("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
  }
}

async function assertWorkflowPreconditions({ lead, toState }) {
  const conflictCheck = await findConflictCheckByLeadId(lead.id);
  const intake = await findLatestIntakeByLeadId(lead.id);
  const enrichedLead = {
    ...lead,
    conflict_check_result: conflictCheck?.result ?? null,
  };

  if (toState === "attorney_review") {
    assertLeadCanMoveToAttorneyReview(conflictCheck);
  }

  if (toState === "accepted") {
    assertLeadCanMoveToAccepted(
      enrichedLead,
      intake,
      conflictCheck?.jurisdiction_or_location
    );
  }

  if (toState === "engaged") {
    assertLeadCanMoveToEngaged(enrichedLead);
  }
}

export async function updateLeadState({ leadId, state, actor, reason = null }) {
  assertStaffAccess(actor);

  const lead = await findLeadById(leadId);

  if (!lead) {
    throw leadNotFoundError();
  }

  if (isAttorney(actor) && !isAdmin(actor) && !isLeadVisibleToAttorney(lead)) {
    throw new AppError("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
  }

  assertCanTransitionLeadState({
    actor,
    fromState: lead.status,
    toState: state,
  });

  await assertWorkflowPreconditions({ lead, toState: state });

  const updated = await updateLeadStateById(leadId, state);

  if (!updated) {
    throw leadNotFoundError();
  }

  await recordAuditEvent({
    eventType: AUDIT_EVENT_TYPES.LEAD_STATUS_CHANGE,
    category: AUDIT_CATEGORIES.LEAD_WORKFLOW,
    action: "status_change",
    result: AUDIT_RESULTS.SUCCESS,
    ...buildActor(actor),
    targetType: "lead",
    targetId: leadId,
    metadata: {
      oldStatus: lead.status,
      newStatus: state,
      reasonCode: reason ? "provided" : null,
    },
  });

  return updated;
}
