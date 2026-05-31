import test from "node:test";
import assert from "node:assert/strict";
import {
  AppError,
  agreementNotFoundError,
  intakeNotFoundError,
  isAppError,
  leadNotFoundError,
  onboardingPacketNotFoundError,
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

test("intake and document error factories return consistent AppError shapes", () => {
  const cases = [
    {
      factory: intakeNotFoundError,
      statusCode: 404,
      code: "INTAKE_NOT_FOUND",
      message: "Intake record not found for this lead",
    },
    {
      factory: agreementNotFoundError,
      statusCode: 404,
      code: "AGREEMENT_NOT_FOUND",
      message: "Agreement not found",
    },
    {
      factory: onboardingPacketNotFoundError,
      statusCode: 404,
      code: "ONBOARDING_PACKET_NOT_FOUND",
      message: "Onboarding packet not found",
    },
  ];

  for (const { factory, statusCode, code, message } of cases) {
    const error = factory();

    assert.equal(isAppError(error), true);
    assert.equal(error.name, "AppError");
    assert.equal(error.statusCode, statusCode);
    assert.equal(error.code, code);
    assert.equal(error.message, message);
  }
});
