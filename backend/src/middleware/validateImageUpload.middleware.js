import { scanUploadForViruses } from "../services/virus-scan.service.js";
import {
  assertUploadedImageContent,
  removeUploadFile,
} from "../services/upload-storage.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const validateImageUploadContent = asyncHandler(async (req, _res, next) => {
  try {
    req.file = await assertUploadedImageContent(req.file);
    await scanUploadForViruses(req.file.path);
    next();
  } catch (error) {
    await removeUploadFile(req.file);
    throw error;
  }
});
