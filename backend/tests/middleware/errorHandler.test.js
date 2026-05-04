import test from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "../../src/middleware/errorHandler.js";
import { mockRequest, mockResponse } from "../helpers/mockHttp.js";

function appError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

test("errorHandler returns the error.statusCode for AppError-style errors", () => {
  const req = mockRequest();
  const res = mockResponse();

  errorHandler(appError("Lead not found", 404), req, res, () => {});

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.message, "Lead not found");
  assert.equal(res.body.requestId, req.id);
});

test("errorHandler returns 403 with the supplied message for forbidden errors", () => {
  const req = mockRequest();
  const res = mockResponse();

  errorHandler(appError("You do not have access", 403), req, res, () => {});

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, "You do not have access");
});

test("errorHandler defaults to 500 for unknown errors", () => {
  const req = mockRequest();
  const res = mockResponse();

  errorHandler(new Error("boom"), req, res, () => {});

  assert.equal(res.statusCode, 500);
});

test("errorHandler exposes the message for unknown errors in development (default env)", () => {
  const req = mockRequest();
  const res = mockResponse();

  errorHandler(new Error("dev-only details"), req, res, () => {});

  assert.equal(res.body.message, "dev-only details");
});

test("errorHandler always responds with the standard {message, requestId} shape", () => {
  const req = mockRequest();
  const res = mockResponse();

  errorHandler(appError("nope", 400), req, res, () => {});

  assert.deepEqual(Object.keys(res.body).sort(), ["message", "requestId"]);
});

test("errorHandler does not leak the stack trace in the response body", () => {
  const req = mockRequest();
  const res = mockResponse();
  const err = new Error("oops");
  err.stack = "internal-stack-trace";

  errorHandler(err, req, res, () => {});

  assert.ok(!("stack" in res.body));
  assert.ok(!JSON.stringify(res.body).includes("internal-stack-trace"));
});

test("errorHandler maps a MulterError without a status code to 400", () => {
  const req = mockRequest();
  const res = mockResponse();
  const err = new Error("File too large");
  err.name = "MulterError";

  errorHandler(err, req, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "File too large");
});

test("errorHandler hides 5xx messages but keeps 4xx messages in production mode", async (t) => {
  t.mock.module("../../src/config/env.js", {
    exports: { default: { isProduction: true } },
  });

  const { errorHandler: prodErrorHandler } = await import(
    `../../src/middleware/errorHandler.js?case=prod`
  );

  const req5xx = mockRequest();
  const res5xx = mockResponse();
  prodErrorHandler(new Error("internal details"), req5xx, res5xx, () => {});

  assert.equal(res5xx.statusCode, 500);
  assert.equal(res5xx.body.message, "Server error");

  const req4xx = mockRequest();
  const res4xx = mockResponse();
  prodErrorHandler(appError("Validation failed", 400), req4xx, res4xx, () => {});

  assert.equal(res4xx.statusCode, 400);
  assert.equal(res4xx.body.message, "Validation failed");
});
