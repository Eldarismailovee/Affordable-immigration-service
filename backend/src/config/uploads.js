import env from "./env.js";

export const uploadsConfig = Object.freeze({
  storageDriver: env.UPLOAD_STORAGE_DRIVER,
  virusScanEnabled: env.UPLOAD_VIRUS_SCAN_ENABLED,
  virusScanCommand: env.UPLOAD_VIRUS_SCAN_COMMAND,
  virusScanTimeoutMs: env.UPLOAD_VIRUS_SCAN_TIMEOUT_MS,
});
