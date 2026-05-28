import { Router } from "express";
import { uploadImageController } from "../../controllers/upload.controller.js";
import { uploadImageMiddleware } from "../../middleware/upload.middleware.js";
import { validateImageUploadContent } from "../../middleware/validateImageUpload.middleware.js";
import { validateUploadedFile } from "../../middleware/validateUploadedFile.js";
import { imageUploadFileSchema } from "../../schemas/domain.schema.js";

const router = Router();

router.post(
  "/image",
  uploadImageMiddleware,
  validateUploadedFile(imageUploadFileSchema),
  validateImageUploadContent,
  uploadImageController
);

export default router;
