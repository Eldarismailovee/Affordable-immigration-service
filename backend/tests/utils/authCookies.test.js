import test from "node:test";
import assert from "node:assert/strict";
import {
  getRefreshCookieClearOptions,
  getRefreshCookieOptions,
  readCookie,
  REFRESH_TOKEN_COOKIE_NAME,
} from "../../src/utils/authCookies.js";

test("REFRESH_TOKEN_COOKIE_NAME uses refresh_token in non-production", () => {
  assert.equal(REFRESH_TOKEN_COOKIE_NAME, "refresh_token");
});

test("getRefreshCookieOptions sets HttpOnly, SameSite, and Path", () => {
  const options = getRefreshCookieOptions();
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.path, "/");
  assert.equal(options.secure, false);
  assert.ok(options.maxAge > 0);
});

test("getRefreshCookieClearOptions matches path and security flags", () => {
  const options = getRefreshCookieClearOptions();
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.path, "/");
  assert.equal(options.secure, false);
});

test("readCookie handles empty and malformed cookie headers", () => {
  assert.equal(readCookie({ headers: {} }, "token"), undefined);
  assert.equal(readCookie({ headers: { cookie: "malformed" } }, "token"), undefined);
  assert.equal(readCookie({ headers: { cookie: "token=" } }, "token"), "");
});
