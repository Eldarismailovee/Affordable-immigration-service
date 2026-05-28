import { invalidPaymentStatusError } from "./errors.js";
import { assertAdmin } from "./user.policy.js";
import { paymentStatusSchema } from "./validators.js";

export function assertCanUpdatePaymentStatus(actor) {
  return assertAdmin(actor);
}

export function parsePaymentStatus(status) {
  const result = paymentStatusSchema.safeParse(status);

  if (!result.success) {
    throw invalidPaymentStatusError();
  }

  return result.data;
}
