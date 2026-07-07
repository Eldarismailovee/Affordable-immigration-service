import { runIdempotentCommand } from "../services/idempotency.service.js";
import { IDEMPOTENCY_REPLAY_HEADER } from "../constants/idempotency.js";

export async function executeIdempotentHttpCommand({
  req,
  authorizeReplay,
  auditContext = null,
  actor = null,
  ttlSeconds,
  handler,
}) {
  const idempotency = req.idempotency;

  if (!idempotency?.keyHash) {
    throw new Error("Idempotency context missing; attach requireIdempotencyKey middleware.");
  }

  const requestHash = idempotency.buildRequestHash();

  return runIdempotentCommand({
    operation: idempotency.operation,
    actorScope: idempotency.actorScope,
    idempotencyKeyHash: idempotency.keyHash,
    keyFingerprint: idempotency.fingerprint,
    requestHash,
    ttlSeconds,
    authorizeReplay,
    auditContext,
    actor: actor ?? req.user ?? null,
    execute: handler,
  });
}

export function applyIdempotentReplayHeader(res, replayed) {
  if (replayed) {
    res.set(IDEMPOTENCY_REPLAY_HEADER, "true");
  }
}
