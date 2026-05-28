import multer from "multer";
import { IMAGE_UPLOAD_MIME_TYPES, MAX_IMAGE_UPLOAD_BYTES } from "../constants/domain.js";
import {
  buildSafeImageFilename,
  uploadsDir,
} from "../services/upload-storage.service.js";
import { AppError } from "../utils/appError.js";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    try {
      cb(null, buildSafeImageFilename(file));
    } catch (error) {
      cb(error);
    }
  },
});

function fileFilter(_req, file, cb) {
  if (IMAGE_UPLOAD_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  const error = new AppError(
    "Only JPEG, PNG, WebP, or GIF uploads are allowed",
    400,
    "INVALID_UPLOAD_MIME_TYPE"
  );
  cb(error);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_IMAGE_UPLOAD_BYTES,
  },
});

export const uploadImageMiddleware = upload.single("image");
