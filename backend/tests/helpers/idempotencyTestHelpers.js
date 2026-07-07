import { randomUUID } from "crypto";

export function newIdempotencyKey() {
  return randomUUID();
}

export function withIdempotencyKey(headers = {}, key = newIdempotencyKey()) {
  return {
    ...headers,
    "Idempotency-Key": key,
  };
}
