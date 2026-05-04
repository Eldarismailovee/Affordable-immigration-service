import test from "node:test";
import assert from "node:assert/strict";
import { requireAuth, requireRole } from "../../src/middleware/auth.js";
import { mockRequest, mockResponse, nextSpy } from "../helpers/mockHttp.js";

test("requireAuth rejects unauthenticated requests with 401", () => {
  const req = mockRequest({ user: null });
  const res = mockResponse();
  const next = nextSpy();

  requireAuth(req, res, next);

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Authentication required");
  assert.equal(next.calls.length, 0);
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

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Authentication required");
});

test("requireRole rejects users without the required role with 403", () => {
  const middleware = requireRole("admin");
  const req = mockRequest({ user: { id: "u-1", role: "user" } });
  const res = mockResponse();
  const next = nextSpy();

  middleware(req, res, next);

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, "Insufficient permissions");
  assert.equal(next.calls.length, 0);
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
