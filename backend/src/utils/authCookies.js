import env from "../config/env.js";
import { REFRESH_TOKEN_TTL_DAYS } from "./auth.js";

export const REFRESH_TOKEN_COOKIE_NAME = env.isProduction
  ? "__Host-refresh_token"
  : "refresh_token";

export function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

export function getRefreshCookieClearOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
  };
}

export function readCookie(req, name) {
  const header = req.headers.cookie || "";

  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eqIndex = trimmed.indexOf("=");

    if (eqIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, eqIndex);

    if (key === name) {
      const rawValue = trimmed.slice(eqIndex + 1);

      try {
        return decodeURIComponent(rawValue);
      } catch {
        return rawValue;
      }
    }
  }

  return undefined;
}

export function readRefreshTokenCookie(req) {
  return readCookie(req, REFRESH_TOKEN_COOKIE_NAME);
}

export function setRefreshTokenCookie(res, refreshToken) {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
}

export function clearRefreshTokenCookie(res) {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getRefreshCookieClearOptions());
}
