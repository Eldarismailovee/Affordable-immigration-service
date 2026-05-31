import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";
import { getPublicAvailabilityConfig } from "../constants/jurisdictionAvailability.js";
import { getPublicResponsibleAttorneyProfile } from "../constants/responsibleAttorney.js";
import { z } from "zod";

const availabilityResponseSchema = z.object({
  availability: z.record(z.string(), z.unknown()),
});

const responsibleAttorneyResponseSchema = z.object({
  responsibleAttorney: z.record(z.string(), z.unknown()),
});

export const getPublicAvailabilityController = asyncHandler(async (_req, res) => {
  sendResponse(res, availabilityResponseSchema, {
    availability: getPublicAvailabilityConfig(),
  });
});

export const getPublicResponsibleAttorneyController = asyncHandler(async (_req, res) => {
  sendResponse(res, responsibleAttorneyResponseSchema, {
    responsibleAttorney: getPublicResponsibleAttorneyProfile(),
  });
});
