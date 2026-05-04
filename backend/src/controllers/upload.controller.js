import { uploadImageResponseSchema } from "../schemas/response.schema.js";
import { buildUploadedImageResponse } from "../services/upload.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const uploadImageController = asyncHandler((req, res) => {
  const requestOrigin = `${req.protocol}://${req.get("host")}`;
  const result = buildUploadedImageResponse(req.file, { requestOrigin });

  sendResponse(res, uploadImageResponseSchema, result, 201);
});
