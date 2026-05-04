import test from "node:test";
import assert from "node:assert/strict";
import { requireAuth, requireRole } from "../../src/middleware/auth.js";
import { mockRequest, mockResponse, nextSpy } from "../helpers/mockHttp.js";

test("requireAuth rejects unauthenticated requests with 401", () => {
  const req = mockRequest({ user: null });
  const res = mockResponse();
  const next = nextSpy();

  requireAuth(req, res, next);

  assert.equal(next.calls.length, 1);
  assert.equal(next.calls[0].statusCode, 401);
  assert.equal(next.calls[0].message, "Authentication required");
  assert.equal(next.calls[0].code, "AUTHENTICATION_REQUIRED");
  assert.equal(res.body, null);
});

test("requireAuth allows authenticated requests through", () => {
  const req = mockRequest({ user: { id: "u-1", role: "user" } });
  const res = mockResponse();
  const next = nextSpy();

  requireAuth(req, res, next);

  assert.equal(next.calls.length, 1);
  assert.equal(next.calls[0], null);
  assert.equal(res.body, null);
});

test("requireRole rejects unauthenticated requests with 401", () => {
  const middleware = requireRole("admin");
  const req = mockRequest({ user: null });
  const res = mockResponse();
  const next = nextSpy();

  middleware(req, res, next);

  assert.equal(next.calls.length, 1);
  assert.equal(next.calls[0].statusCode, 401);
  assert.equal(next.calls[0].message, "Authentication required");
  assert.equal(next.calls[0].code, "AUTHENTICATION_REQUIRED");
});

test("requireRole rejects users without the required role with 403", () => {
  const middleware = requireRole("admin");
  const req = mockRequest({ user: { id: "u-1", role: "user" } });
  const res = mockResponse();
  const next = nextSpy();

  middleware(req, res, next);

  assert.equal(next.calls.length, 1);
  assert.equal(next.calls[0].statusCode, 403);
  assert.equal(next.calls[0].message, "Insufficient permissions");
  assert.equal(next.calls[0].code, "INSUFFICIENT_PERMISSIONS");
  assert.equal(res.body, null);
});

test("requireRole allows users matching one of the listed roles", () => {
  const middleware = requireRole("admin", "user");
  const req = mockRequest({ user: { id: "u-1", role: "user" } });
  const res = mockResponse();
  const next = nextSpy();

  middleware(req, res, next);

  assert.equal(next.calls.length, 1);
  assert.equal(next.calls[0], null);
});
