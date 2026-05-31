import { z } from "zod";
import {
  containsCardLikeData,
  PAYMENT_CARD_DATA_MESSAGE,
} from "../utils/paymentRedaction.js";

export function rejectPaymentCardData(value, ctx) {
  if (value && containsCardLikeData(value)) {
    ctx.addIssue({
      code: "custom",
      message: PAYMENT_CARD_DATA_MESSAGE,
    });
  }
}

export const userFacingPaymentNotesSchema = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .default("")
  .superRefine(rejectPaymentCardData);

export const adminFreeTextNotesSchema = z.string().trim().max(4000).optional();
