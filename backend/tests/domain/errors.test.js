import test from "node:test";
import assert from "node:assert/strict";
import {
  AppError,
  isAppError,
  leadNotFoundError,
} from "../../src/domain/errors.js";
import { AppError as LegacyAppError } from "../../src/utils/appError.js";

test("domain/errors owns the AppError class and utils/appError re-exports it", () => {
  assert.equal(AppError, LegacyAppError);

  const error = leadNotFoundError();

  assert.equal(isAppError(error), true);
  assert.equal(error.name, "AppError");
  assert.equal(error.statusCode, 404);
  assert.equal(error.code, "LEAD_NOT_FOUND");
});
