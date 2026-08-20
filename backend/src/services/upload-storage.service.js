import { randomUUID } from "crypto";
import { promises as fsPromises } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  IMAGE_UPLOAD_EXTENSION_BY_MIME_TYPE,
  IMAGE_UPLOAD_EXTENSIONS,
  IMAGE_UPLOAD_MIME_TYPES,
} from "../constants/domain.js";
import { AppError } from "../utils/appError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadsDir = path.resolve(__dirname, "../../uploads");

export async function ensureUploadDirectory() {
  await fsPromises.mkdir(uploadsDir, { recursive: true });
}

function extensionFromOriginalName(originalName = "") {
  const extension = path.extname(originalName).toLowerCase();
  return IMAGE_UPLOAD_EXTENSIONS.includes(extension) ? extension : "";
}

export function buildSafeImageFilename(file) {
  const extension =
    IMAGE_UPLOAD_EXTENSION_BY_MIME_TYPE[file?.mimetype] ||
    extensionFromOriginalName(file?.originalname);

  if (!extension) {
    throw new AppError("Unsupported image type", 400, "INVALID_UPLOAD_MIME_TYPE");
  }

  return `${randomUUID()}${extension}`;
}

export function assertSafeUploadFilename(filename) {
  const normalized = path.basename(filename || "");
  const extension = path.extname(normalized).toLowerCase();

  if (
    !normalized ||
    normalized !== filename ||
    normalized.length > 255 ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(normalized) ||
    !IMAGE_UPLOAD_EXTENSIONS.includes(extension)
  ) {
    throw new AppError("Uploaded file not found", 404, "UPLOAD_NOT_FOUND");
  }

  return normalized;
}

export function resolveUploadPath(filename) {
  const safeFilename = assertSafeUploadFilename(filename);
  const resolvedPath = path.resolve(uploadsDir, safeFilename);

  if (!resolvedPath.startsWith(`${uploadsDir}${path.sep}`)) {
    throw new AppError("Uploaded file not found", 404, "UPLOAD_NOT_FOUND");
  }

  return resolvedPath;
}

export function detectImageMimeType(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    return null;
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  if (
    buffer.length >= 6 &&
    ["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6))
  ) {
    return "image/gif";
  }

  return null;
}

export async function detectUploadedImageMimeType(filePath) {
  const handle = await fsPromises.open(filePath, "r");

  try {
    const buffer = Buffer.alloc(16);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    return detectImageMimeType(buffer.subarray(0, bytesRead));
  } finally {
    await handle.close();
  }
}

export async function removeUploadFile(fileOrPath) {
  const filePath = typeof fileOrPath === "string" ? fileOrPath : fileOrPath?.path;

  if (!filePath) {
    return;
  }

  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

export async function assertUploadedImageContent(file) {
  if (!file?.path || !file?.filename) {
    throw new AppError("No image file uploaded", 400, "FILE_UPLOAD_REQUIRED");
  }

  const safeFilename = assertSafeUploadFilename(file.filename);
  const safeFilePath = resolveUploadPath(safeFilename);
  const detectedMimeType = await detectUploadedImageMimeType(safeFilePath);

  if (!detectedMimeType || !IMAGE_UPLOAD_MIME_TYPES.includes(detectedMimeType)) {
    await removeUploadFile(safeFilePath);
    throw new AppError(
      "Uploaded file content is not a supported image",
      400,
      "INVALID_UPLOAD_CONTENT_TYPE"
    );
  }

  if (detectedMimeType !== file.mimetype) {
    await removeUploadFile(safeFilePath);
    throw new AppError(
      "Uploaded file content does not match declared MIME type",
      400,
      "UPLOAD_MIME_TYPE_MISMATCH"
    );
  }

  return {
    ...file,
    path: safeFilePath,
    filename: safeFilename,
    detectedMimeType,
  };
}

export async function getPublicUploadedImage(filename) {
  const filePath = resolveUploadPath(filename);

  let fileStats;
  try {
    fileStats = await fsPromises.stat(filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new AppError("Uploaded file not found", 404, "UPLOAD_NOT_FOUND");
    }

    throw error;
  }

  if (!fileStats.isFile()) {
    throw new AppError("Uploaded file not found", 404, "UPLOAD_NOT_FOUND");
  }

  const mimeType = await detectUploadedImageMimeType(filePath);

  if (!mimeType || !IMAGE_UPLOAD_MIME_TYPES.includes(mimeType)) {
    throw new AppError("Uploaded file not found", 404, "UPLOAD_NOT_FOUND");
  }

  return {
    path: filePath,
    filename: path.basename(filePath),
    mimeType,
    size: fileStats.size,
  };
}
