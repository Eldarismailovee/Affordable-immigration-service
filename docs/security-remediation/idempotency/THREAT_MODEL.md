# Idempotency Threat Model (BUS-005)

## Assets

- Idempotency records (hashed keys, request hashes, replay responses)
- Business rows created by sensitive commands (leads, DSAR, payments, agreements)
- Audit/security evidence

## Trust boundaries

- Client generates high-entropy `Idempotency-Key` (UUID recommended)
- Server scopes keys by actor + operation; never global
- Raw keys are HMAC-fingerprinted before storage

## Scenarios

| Scenario | Mitigation |
| -------- | ---------- |
| Response lost after commit | Client retries same key → completed replay |
| Double-click | Same key → one effect or `409 in_progress` |
| Frontend auto-retry | Same in-memory key until success |
| Reverse proxy retry | Server-side record dedupes |
| Concurrent identical requests | Unique `(actor_scope, operation, key_hash)` + transaction |
| Same key, different payload | `409 idempotency_key_conflict` + rate-limited audit |
| Key reused by another user | Different `actor_scope` → independent records |
| Key reused on different endpoint | Different `operation` → independent |
| Key reused after role loss | Replay re-runs `authorizeReplay` → 403 |
| Stale `processing` after crash | Timeout → `failed_retryable` → reacquire on matching retry |
| Process dies before commit | Transaction rollback removes processing row |
| Process dies after commit | Replay returns stored result |
| DB committed, provider not called | Docketwise/email/payment provider flows marked **partial** |
| Provider called, DB not committed | Idempotency row not `completed`; retry safe for DB-only paths |
| Response too large | Rejected at persist time (`IDEMPOTENCY_RESPONSE_TOO_LARGE`) |
| Replay returns stale permissions | `authorizeReplay` on each replay |
| Attacker floods keys | TTL + cleanup; keys stored as HMAC only |
| Weak/guessable keys | Client must use CSPRNG; server rejects PII/JWT/email patterns |
| Early cleanup | Only expired terminal rows deleted; processing retained until timeout |
| Retry after TTL expiry | New key required; old business state may reject duplicate via domain guards |

## Out of scope for this pass

- Payment/Docketwise/email provider-native idempotency (documented as remaining risk)
- Browser localStorage draft PII (DATA-001)
