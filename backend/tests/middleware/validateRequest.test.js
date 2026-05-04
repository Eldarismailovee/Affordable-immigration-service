import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { validateRequest } from "../../src/middleware/validateRequest.js";
import { mockRequest, mockResponse, nextSpy } from "../helpers/mockHttp.js";

test("validateRequest passes through a valid body and overwrites req.body with parsed data", () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().int(),
  });
  const middleware = validateRequest(schema);

  const req = mockRequest({ body: { name: "Ari", age: 30, extra: "ignored" } });
  const res = mockResponse();
  const next = nextSpy();

  middleware(req, res, next);

  assert.equal(next.calls.length, 1);
  assert.equal(next.calls[0], null);
  assert.deepEqual(req.body, { name: "Ari", age: 30 });
});

test("validateRequest returns 400 with errors[] for an invalid body", () => {
  const schema = z.object({
    email: z.email(),
    password: z.string().min(8),
  });
  const middleware = validateRequest(schema);

  const req = mockRequest({ body: { email: "bad", password: "short" } });
  const res = mockResponse();
  const next = nextSpy();

  middleware(req, res, next);

  assert.equal(next.calls.length, 0);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "Validation failed");
  assert.ok(Array.isArray(res.body.errors));
  assert.equal(res.body.errors.length, 2);
  for (const issue of res.body.errors) {
    assert.ok(["email", "password"].includes(issue.path));
    assert.equal(typeof issue.message, "string");
  }
});

test("validateRequest validates multiple sources (body, params, query) and aggregates errors", () => {
  const middleware = validateRequest({
    body: z.object({ name: z.string().min(1) }),
    params: z.object({ id: z.uuid() }),
    query: z.object({ flag: z.enum(["yes", "no"]) }),
  });

  const req = mockRequest({
    body: { name: "" },
    params: { id: "not-uuid" },
    query: { flag: "maybe" },
  });
  const res = mockResponse();
  const next = nextSpy();

  middleware(req, res, next);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.errors.length, 3);
  const paths = res.body.errors.map((issue) => issue.path).sort();
  assert.deepEqual(paths, ["body.name", "params.id", "query.flag"]);
});

test("validateRequest accepts a multi-source schema and writes parsed values back", () => {
  const middleware = validateRequest({
    params: z.object({ id: z.uuid() }),
  });

  const validId = "550e8400-e29b-41d4-a716-446655440000";
  const req = mockRequest({ params: { id: validId } });
  const res = mockResponse();
  const next = nextSpy();

  middleware(req, res, next);

  assert.equal(next.calls.length, 1);
  assert.equal(next.calls[0], null);
  assert.deepEqual(req.params, { id: validId });
});
