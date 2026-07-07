const retryState = new Map();

function commandKey(method, path) {
  return `${method.toUpperCase()}:${path}`;
}

export function createIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function beginIdempotentCommand(method, path) {
  const key = commandKey(method, path);
  const existing = retryState.get(key);

  if (existing) {
    return existing;
  }

  const idempotencyKey = createIdempotencyKey();
  retryState.set(key, idempotencyKey);
  return idempotencyKey;
}

export function clearIdempotentCommand(method, path) {
  retryState.delete(commandKey(method, path));
}

export function idempotencyHeaders(method, path, options = {}) {
  const { fresh = false } = options;

  if (fresh) {
    clearIdempotentCommand(method, path);
  }

  const key = beginIdempotentCommand(method, path);

  return {
    "Idempotency-Key": key,
  };
}

export function markIdempotentCommandSuccess(method, path) {
  clearIdempotentCommand(method, path);
}

export function isIdempotencyConflict(error) {
  return error?.code === "idempotency_key_conflict";
}

export function isIdempotencyInProgress(error) {
  return error?.code === "idempotency_request_in_progress";
}

export function isIdempotencyKeyRequired(error) {
  return error?.code === "idempotency_key_required";
}

export function clearIdempotencyState() {
  retryState.clear();
}

/** Test-only helper */
export function resetIdempotencyStateForTests() {
  clearIdempotencyState();
}
