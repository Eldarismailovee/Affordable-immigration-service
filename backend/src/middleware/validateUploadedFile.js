import { removeUploadFile } from "../services/upload-storage.service.js";
import { AppError } from "../utils/appError.js";

export function validateUploadedFile(schema) {
  return async (req, _res, next) => {
    try {
      const result = schema.safeParse(req.file);

      if (!result.success) {
        await removeUploadFile(req.file);

        const error = new AppError(
          "Upload validation failed",
          400,
          "UPLOAD_VALIDATION_FAILED"
        );
        error.details = result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }));

        next(error);
        return;
      }

      req.file = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}
