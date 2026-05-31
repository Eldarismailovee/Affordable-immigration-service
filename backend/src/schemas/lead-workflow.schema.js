import { z } from "zod";
import {
  ATTORNEY_REVIEW_RESULT_STATUSES,
  CONFLICT_CHECK_RESULT_STATUSES,
  LEAD_STATUSES,
} from "../constants/domain.js";
import { adminFreeTextNotesSchema } from "./payment-notes.schema.js";

export const updateLeadStatusSchema = z
  .object({
    state: z.enum(LEAD_STATUSES),
    reason: adminFreeTextNotesSchema,
  })
  .strict();

export const submitConflictCheckSchema = z
  .object({
    opposingPartyNames: z.array(z.string().trim().min(1).max(200)).max(50).default([]),
    relatedPersonNames: z.array(z.string().trim().min(1).max(200)).max(50).default([]),
    matterType: z.string().trim().min(1).max(100),
    jurisdiction: z.string().trim().max(100).optional(),
    caseSummary: z.string().trim().max(4000).optional(),
    notes: z.string().trim().max(4000).optional(),
  })
  .strict();

export const updateConflictCheckSchema = z
  .object({
    opposingPartyNames: z.array(z.string().trim().min(1).max(200)).max(50).optional(),
    relatedPersonNames: z.array(z.string().trim().min(1).max(200)).max(50).optional(),
    matterType: z.string().trim().max(100).optional(),
    jurisdiction: z.string().trim().max(100).optional(),
    caseSummary: z.string().trim().max(4000).optional(),
    result: z.enum(CONFLICT_CHECK_RESULT_STATUSES).optional(),
    notes: z.string().trim().max(4000).optional(),
  })
  .strict();

export const attorneyReviewSchema = z
  .object({
    decision: z.enum(["accepted", "declined"]),
    reviewNotes: adminFreeTextNotesSchema,
    confirmResponsibleAttorney: z.boolean().optional().default(false),
  })
  .strict();

export const approveLegalRecommendationSchema = z
  .object({
    reviewNotes: adminFreeTextNotesSchema,
  })
  .strict();

export const conflictCheckResultSchema = z.enum(CONFLICT_CHECK_RESULT_STATUSES);
export const attorneyReviewStatusSchema = z.enum(ATTORNEY_REVIEW_RESULT_STATUSES);
