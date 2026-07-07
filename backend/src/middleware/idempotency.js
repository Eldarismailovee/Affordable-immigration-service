import { IDEMPOTENCY_REQUIRED_OPERATIONS } from "../constants/idempotency.js";
import { validateIdempotencyKey } from "../utils/idempotencyKey.js";
import {
  buildActorScope,
  buildRequestHashInput,
} from "../services/idempotency.service.js";

export function requireIdempotencyKey(operation) {
  return (req, _res, next) => {
    try {
      if (!IDEMPOTENCY_REQUIRED_OPERATIONS.has(operation)) {
        return next();
      }

      const parsed = validateIdempotencyKey(req.headers["idempotency-key"]);

      req.idempotency = {
        operation,
        key: parsed.normalized,
        keyHash: parsed.keyHash,
        fingerprint: parsed.fingerprint,
        actorScope: buildActorScope({ user: req.user }),
        buildRequestHash: (input = {}) =>
          buildRequestHashInput({
            operation,
            actorScope: req.idempotency.actorScope,
            body: input.body ?? req.body ?? null,
            pathParams: input.pathParams ?? req.params ?? null,
            queryParams: input.queryParams ?? req.query ?? null,
          }),
      };

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export function attachAnonymousActorScope(anonymousScope = "anonymous:public") {
  return (req, _res, next) => {
    if (req.idempotency) {
      req.idempotency.actorScope = anonymousScope;
    }

    next();
  };
}
