import {
  findLeadById,
  updateLeadStateById,
} from "../repositories/lead.repository.js";
import { leadNotFoundError } from "../domain/errors.js";
import {
  assertLeadStateTransition,
  isLeadVisibleToAttorney,
} from "../domain/lead-state.policy.js";
import { isAdmin, isAttorney } from "../domain/user.policy.js";
import { AppError } from "../utils/appError.js";
import { assertStaffAccess } from "./access.service.js";

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
    accepted: ["filed", "declined"],
  };

  const allowed = attorneyAllowed[fromState] || [];

  if (!allowed.includes(toState)) {
    throw new AppError("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS");
  }
}

export async function updateLeadState({ leadId, state, actor }) {
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

  const updated = await updateLeadStateById(leadId, state);

  if (!updated) {
    throw leadNotFoundError();
  }

  return updated;
}
