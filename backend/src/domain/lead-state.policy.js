import { AppError } from "./errors.js";

export const LEAD_STATE_TRANSITIONS = {
  new: ["conflict_check", "declined"],
  conflict_check: ["attorney_review", "declined"],
  attorney_review: ["accepted", "declined"],
  accepted: ["engaged", "declined"],
  engaged: ["filed"],
  declined: [],
  filed: [],
};

export const ATTORNEY_VISIBLE_LEAD_STATES = [
  "new",
  "conflict_check",
  "attorney_review",
  "accepted",
  "engaged",
  "declined",
  "filed",
];

export function assertLeadStateTransition(fromState, toState) {
  const allowed = LEAD_STATE_TRANSITIONS[fromState] || [];

  if (!allowed.includes(toState)) {
    throw new AppError(
      "Invalid lead state transition",
      400,
      "INVALID_LEAD_STATE_TRANSITION"
    );
  }
}

export function isLeadVisibleToAttorney(lead) {
  return ATTORNEY_VISIBLE_LEAD_STATES.includes(lead?.status);
}
