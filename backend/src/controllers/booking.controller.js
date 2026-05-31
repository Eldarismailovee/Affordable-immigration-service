import { assertProcessingNotRestricted } from "../domain/processing.policy.js";
import { createBookingRequest } from "../services/booking.service.js";
import { bookingCreateResponseSchema } from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const createBookingController = asyncHandler((req, res) => {
  assertProcessingNotRestricted(req.user);
  const result = createBookingRequest(req.body);
  sendResponse(res, bookingCreateResponseSchema, result, 201);
});
