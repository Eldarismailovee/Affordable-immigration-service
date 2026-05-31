import {
  approveLegalRecommendation,
  getConflictCheckForLead,
  submitAttorneyReview,
  submitConflictCheck,
  updateConflictCheck,
} from "../services/conflict-check.service.js";
import { updateLeadState } from "../services/lead-state.service.js";
import {
  leadDetailResponseSchema,
  leadMutationResponseSchema,
} from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";
import { z } from "zod";

const conflictCheckResponseSchema = z.object({
  lead: leadMutationResponseSchema.shape.lead,
  conflictCheck: z.record(z.string(), z.unknown()).nullable(),
});

const attorneyReviewResponseSchema = z.object({
  lead: leadMutationResponseSchema.shape.lead,
  conflictCheck: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const getConflictCheckController = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const conflictCheck = await getConflictCheckForLead({ leadId, actor: req.user });
  sendResponse(res, z.object({ conflictCheck: z.record(z.string(), z.unknown()).nullable() }), {
    conflictCheck,
  });
});

export const submitConflictCheckController = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const result = await submitConflictCheck({ leadId, actor: req.user, payload: req.body });
  sendResponse(res, conflictCheckResponseSchema, result);
});

export const updateConflictCheckController = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const result = await updateConflictCheck({ leadId, actor: req.user, payload: req.body });
  sendResponse(res, conflictCheckResponseSchema, result);
});

export const submitAttorneyReviewController = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const result = await submitAttorneyReview({ leadId, actor: req.user, payload: req.body });
  sendResponse(res, attorneyReviewResponseSchema, result);
});

export const approveLegalRecommendationController = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const intake = await approveLegalRecommendation({
    leadId,
    actor: req.user,
    reviewNotes: req.body.reviewNotes,
  });
  sendResponse(res, z.object({ intake: z.record(z.string(), z.unknown()).nullable() }), { intake });
});

export const updateLeadStateWithReasonController = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const { state, reason } = req.body;
  const lead = await updateLeadState({ leadId, state, actor: req.user, reason });
  sendResponse(res, leadMutationResponseSchema, { lead });
});
