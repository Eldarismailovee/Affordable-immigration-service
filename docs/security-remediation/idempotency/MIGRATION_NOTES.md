# Migration 019 — Idempotency Records

## File

`backend/src/db/migrations/019_idempotency_records.sql`

## Table: `idempotency_records`

- Scoped unique: `(actor_scope, operation, idempotency_key_hash)`
- States: `processing`, `completed`, `failed_retryable`, `failed_terminal`
- Stores `request_hash`, safe `response_body` JSONB, no raw client key
- Indexes: `expires_at`, partial `(state, locked_at)` for stale processing

## Deployment

1. Apply migrations through 019 on all environments
2. Set `IDEMPOTENCY_KEY_HMAC_SECRET` (required production)
3. Deploy backend + frontend together (keys mandatory on protected routes)

## Rollback

Forward-only. Rolling back code without dropping table is safe (unused). Dropping table loses replay cache only, not business data.

## Legacy clients

Requests without `Idempotency-Key` receive `400 idempotency_key_required` on protected routes.

## Secret rotation

Rotating `IDEMPOTENCY_KEY_HMAC_SECRET` invalidates lookup of old keys (new HMAC). In-flight client retries should use same secret window or accept one duplicate risk during rotation — document rotation during low traffic.
