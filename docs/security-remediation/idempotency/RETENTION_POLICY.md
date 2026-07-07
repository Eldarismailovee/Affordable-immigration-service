# Idempotency Record Retention

## Default TTL

`IDEMPOTENCY_DEFAULT_TTL_SECONDS` = 86400 (24h) from record creation/completion.

## Cleanup

- Script: `node backend/scripts/idempotency-cleanup.js`
- Deletes batch (default 500) where `expires_at <= now()` and state ∈ `{completed, failed_terminal, failed_retryable}`
- Does **not** delete active `processing` until stale timeout policy marks retryable

## Production scheduling

No built-in cron in this pass. Operators should schedule cleanup (e.g. daily) via external scheduler.

## Legal/audit

Idempotency rows are operational dedup cache, not legal hold records. Security audit events for conflicts follow `SECURITY_AUDIT_RETENTION_DAYS`.
