# BUS-005 Implementation

## Components

| Layer | Path |
| ----- | ---- |
| Constants | `backend/src/constants/idempotency.js` |
| Config | `backend/src/config/idempotency.js` |
| Key validation | `backend/src/utils/idempotencyKey.js` |
| Request hash | `backend/src/utils/canonicalRequestHash.js` |
| Repository | `backend/src/repositories/idempotency.repository.js` |
| Service | `backend/src/services/idempotency.service.js` |
| HTTP helper | `backend/src/utils/idempotentCommand.js` |
| Middleware | `backend/src/middleware/idempotency.js` |
| Migration | `backend/src/db/migrations/019_idempotency_records.sql` |
| Cleanup | `backend/scripts/idempotency-cleanup.js` |
| Frontend | `frontend/src/services/idempotency.js`, `api.js` |

## Algorithm

1. Validate key (middleware, before handler)
2. Auth/MFA/step-up/validation complete **before** idempotency record insert
3. `BEGIN` → insert `processing` (or resolve existing) → business mutation → `completed` → `COMMIT`
4. Replay: re-check authorization, return stored safe body + `Idempotent-Replayed: true`

## Observability

Structured log events: `idempotency.created`, `idempotency.replayed`, `idempotency.conflict`, `idempotency.in_progress`, `idempotency.stale`, `idempotency.cleanup_count` (no full keys).

## Status

**CORE_DATABASE_COMMANDS_FIXED** — database-backed sensitive commands in mandatory scope.

**EXTERNAL_EFFECT_IDEMPOTENCY_NOT_VERIFIED** — payment webhooks, configured Docketwise HTTP, email provider sends, DSAR file deletion on disk.
