import { sanitizeReturnPath } from "../utils/safeReturnPath.js";

const RETURN_PATH_KEY = "ais.nav.returnPath";

function getStorage() {
  if (typeof globalThis.sessionStorage === "undefined") {
    return null;
  }
  return globalThis.sessionStorage;
}

export function setReturnPath(path) {
  const safe = sanitizeReturnPath(path);
  if (!safe) {
    return null;
  }

  getStorage()?.setItem(RETURN_PATH_KEY, safe);
  return safe;
}

export function getReturnPath() {
  const raw = getStorage()?.getItem(RETURN_PATH_KEY);
  return sanitizeReturnPath(raw);
}

export function clearReturnPath() {
  getStorage()?.removeItem(RETURN_PATH_KEY);
}

export function clearSessionNavigationStorage() {
  clearReturnPath();
}
