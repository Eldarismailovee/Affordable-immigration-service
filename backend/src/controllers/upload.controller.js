import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import env from "../config/env.js";
import { IMAGE_UPLOAD_MIME_TYPES, MAX_IMAGE_UPLOAD_BYTES } from "../constants/domain.js";
import { uploadImageResponseSchema } from "../schemas/response.schema.js";
import { sendResponse } from "../utils/sendResponse.js";

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

  const error = new Error("Only JPEG, PNG, WebP, or GIF uploads are allowed");
  error.statusCode = 400;
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

export function uploadImageController(req, res) {
  if (!req.file) {
    return res.status(400).json({
      message: "No image file uploaded",
    });
  }

  const baseUrl = env.BASE_URL || `${req.protocol}://${req.get("host")}`;
  const url = `${baseUrl}/uploads/${req.file.filename}`;

  sendResponse(
    res,
    uploadImageResponseSchema,
    {
      message: "Image uploaded successfully",
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url,
      },
    },
    201
  );
}
