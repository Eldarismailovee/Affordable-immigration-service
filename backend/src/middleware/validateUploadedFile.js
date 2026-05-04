import fs from "fs";

function removeRejectedUpload(file) {
  if (!file?.path) {
    return;
  }

  fs.unlink(file.path, () => {});
}

export function validateUploadedFile(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.file);

    if (!result.success) {
      removeRejectedUpload(req.file);

      return res.status(400).json({
        message: "Upload validation failed",
        errors: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    req.file = result.data;
    next();
  };
}
