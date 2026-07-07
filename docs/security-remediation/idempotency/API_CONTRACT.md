# Idempotency API Contract

## Request header

```http
Idempotency-Key: <opaque-client-generated-value>
```

Required on all operations listed in `COMMAND_INVENTORY.md` (immediate enforcement with updated frontend).

## Key rules

- Non-empty after trim
- Max length: `IDEMPOTENCY_MAX_KEY_LENGTH` (default 128)
- Printable ASCII only (`0x21`–`0x7E`)
- Must not contain `@`, JWT prefixes, or `Bearer`
- Stored server-side as HMAC-SHA256 fingerprint only

## Responses

| Case | HTTP | Code |
| ---- | ---- | ---- |
| Missing key | 400 | `idempotency_key_required` |
| Invalid key | 400 | `invalid_idempotency_key` |
| Same key, different payload | 409 | `idempotency_key_conflict` |
| In progress | 409 | `idempotency_request_in_progress` |
| First success | 200/201 | — |
| Completed replay | Same as original | — |

Replay responses include:

```http
Idempotent-Replayed: true
```

## Error envelope

Uses project standard:

```json
{
  "success": false,
  "message": "...",
  "code": "idempotency_key_conflict",
  "traceId": "...",
  "requestId": "..."
}
```

## Never replayed

- `Set-Cookie`, access/refresh tokens
- MFA/recovery/verification secrets
- DSAR export payload bodies
- One-time signed URLs

## Rollout

Variant **A — immediate enforcement**: frontend updated in same release; server rejects missing keys on protected routes.
