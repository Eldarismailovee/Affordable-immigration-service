import { checkDatabaseReadiness } from "../db/health.js";

const READINESS_CACHE_TTL_MS = 5_000;

let cachedReadiness = null;
let cachedAt = 0;
let pendingReadinessCheck = null;

export async function getCachedReadiness() {
  const now = Date.now();

  if (cachedReadiness && now - cachedAt < READINESS_CACHE_TTL_MS) {
    return cachedReadiness;
  }

  if (!pendingReadinessCheck) {
    pendingReadinessCheck = checkDatabaseReadiness()
      .then((result) => {
        cachedReadiness = result;
        cachedAt = Date.now();
        return result;
      })
      .finally(() => {
        pendingReadinessCheck = null;
      });
  }

  return pendingReadinessCheck;
}
