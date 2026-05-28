import { execFile } from "child_process";
import { uploadsConfig } from "../config/uploads.js";
import { AppError } from "../utils/appError.js";

export function scanUploadForViruses(filePath) {
  if (!uploadsConfig.virusScanEnabled) {
    return Promise.resolve({ scanned: false });
  }

  return new Promise((resolve, reject) => {
    execFile(
      uploadsConfig.virusScanCommand,
      ["--no-summary", filePath],
      { timeout: uploadsConfig.virusScanTimeoutMs },
      (error) => {
        if (error) {
          reject(
            new AppError(
              "Uploaded file failed security scan",
              400,
              "UPLOAD_VIRUS_SCAN_FAILED"
            )
          );
          return;
        }

        resolve({ scanned: true });
      }
    );
  });
}
