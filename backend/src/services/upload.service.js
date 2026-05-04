import env from "../config/env.js";
import { AppError } from "../utils/appError.js";

export function buildUploadedImageResponse(file, { requestOrigin } = {}) {
  if (!file) {
    throw new AppError("No image file uploaded", 400, "FILE_UPLOAD_REQUIRED");
  }

  const baseUrl = env.BASE_URL || requestOrigin;

  return {
    message: "Image uploaded successfully",
    file: {
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `${baseUrl}/uploads/${file.filename}`,
    },
  };
}
