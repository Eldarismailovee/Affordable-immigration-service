import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { IMAGE_UPLOAD_MIME_TYPES, MAX_IMAGE_UPLOAD_BYTES } from "../constants/domain.js";
import { AppError } from "../utils/appError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../../uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeBase = path
      .basename(file.originalname || "image", ext)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();

    cb(null, `${Date.now()}-${safeBase}${ext}`);
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
