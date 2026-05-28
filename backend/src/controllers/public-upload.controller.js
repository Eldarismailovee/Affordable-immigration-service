import { promisify } from "node:util";
import { getPublicUploadedImage } from "../services/upload-storage.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const servePublicUploadedImageController = asyncHandler(async (req, res) => {
  const image = await getPublicUploadedImage(req.params.filename);

  res.set({
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Disposition": `inline; filename="${image.filename}"`,
    "Content-Length": image.size,
  });
  res.type(image.mimeType);
  await promisify(res.sendFile.bind(res))(image.path);
});
