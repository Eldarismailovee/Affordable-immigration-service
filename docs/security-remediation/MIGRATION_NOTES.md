# Migration Notes

## New migrations

1. **`015_case_review_and_docketwise_statuses.sql`**
   - Adds to `intakes`: `petition_relationship`, `location`, `has_urgent_deadline`, `urgent_deadline_notes` (nullable except boolean default false).
   - Expands Docketwise status CHECK on `intakes` and `docketwise_sync` to include `not_configured`, `pending`, `processing`, `failed` (legacy `not_synced`, `synced`, `error` retained).

2. **`016_dsar_deletion_workflow.sql`**
   - Adds DSAR statuses: `processing`, `failed`, `blocked_by_legal_hold`.
   - Adds `deletion_failure_reason`, `deletion_verification_json` to `dsar_requests`.
   - Extends `dsar_request_events` event types for deletion lifecycle.

## Order of application

Apply after existing migrations 001–014 in numeric order (standard `npm run migrate`).

## Backward compatibility

- Existing intakes: new columns NULL/false; no data loss.
- Existing Docketwise rows with `not_synced`/`synced`/`error` remain valid.
- Existing DSAR requests: new statuses available; no automatic re-processing.

## Nullable/default policy

- Case-review text fields nullable for legacy rows.
- `has_urgent_deadline` NOT NULL DEFAULT FALSE.

## Rollback limitations

- Dropping expanded CHECK constraints may fail if new status values exist.
- DSAR deletion metadata columns can be dropped if no production data depends on them.

## Production precautions

- Run migrations before deploying new backend code.
- Provision initial admin via `npm run create-initial-admin -- --email ops@example.com` with `INITIAL_ADMIN_PASSWORD` set (never CLI password arg).
- Set `PAYMENT_HOST_ALLOWLIST` before `NODE_ENV=production`.
- Review existing admin accounts created before this fix; rotate credentials if provenance uncertain.

## Initial admin script

```bash
cd backend
export INITIAL_ADMIN_PASSWORD='...'   # min 12 chars, mixed case + digit
npm run create-initial-admin -- --email admin@yourfirm.example --name "Operations Admin"
```

Script uses advisory lock, refuses duplicate admins, audits provisioning, never prints password/hash.

3. **`019_idempotency_records.sql`** (BUS-005)
   - Table `idempotency_records` with scoped unique `(actor_scope, operation, idempotency_key_hash)`.
   - Requires `IDEMPOTENCY_KEY_HMAC_SECRET` in production before deploy.
   - See `docs/security-remediation/idempotency/MIGRATION_NOTES.md`.

Apply after 018 via `npm run migrate`.

4. **`020_secure_intake_drafts.sql`** (DATA-001)
   - Table `intake_drafts` — one active draft per user, JSONB payload, version, 30-day expiry.
   - Included in DSAR deletion via `deleteIntakeDraftsForUser`.
   - Apply after 019 before deploying frontend/backend with draft API.

Apply after 019 via `npm run migrate`.

