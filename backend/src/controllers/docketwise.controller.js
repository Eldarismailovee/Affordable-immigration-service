import { createDocketwiseLead } from "../services/docketwise.service.js";
import { docketwiseStubResponseSchema } from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const createDocketwiseController = asyncHandler((req, res) => {
  const result = createDocketwiseLead(req.body);
  sendResponse(res, docketwiseStubResponseSchema, result, 201);
});
