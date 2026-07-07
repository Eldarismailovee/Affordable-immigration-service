# Idempotency Command Inventory

Snapshot: branch `main`, migration `019_idempotency_records.sql`.

## Protected commands (Idempotency-Key required)

| Endpoint | Method | Operation | Actor scope | Replay strategy |
| -------- | ------ | --------- | ----------- | --------------- |
| `/api/account/intake` | POST | `intake.create` | `user:{id}` | Stored safe JSON + lead id |
| `/api/account/dsar` | POST | `dsar.create` | `user:{id}` | Stored request summary |
| `/api/public/privacy/request` | POST | `dsar.public.create` | `anonymous:public` | Ack payload without PII export |
| `/api/admin/dsar/:id/anonymize` | POST | `dsar.anonymize` | `admin:{id}` | Safe DSAR status (no export payload) |
| `/api/admin/dsar/:id/export` | POST | `dsar.export` | `admin:{id}` | Safe DSAR status (export payload stripped) |
| `/api/admin/payments/:leadId/hosted-url` | PATCH | `payment.hosted_url.set` | `admin:{id}` | Payment record snapshot |
| `/api/admin/payments/:leadId/status` | PATCH | `payment.status.update` | `admin:{id}` | Payment record snapshot |
| `/api/admin/users/:userId/role` | PATCH | `admin.user.role.change` | `admin:{id}` | Sanitized user |
| `/api/admin/users/:userId` | DELETE | `admin.user.delete` | `admin:{id}` | Sanitized user |
| `/api/auth/mfa/admin/reset` | POST | `mfa.admin.reset` | `admin:{id}` | Message only (no secrets) |
| `/api/admin/docketwise/:leadId/sync` | POST | `docketwise.sync` | `admin:{id}` | Sync row snapshot |
| `/api/admin/agreement/:leadId/generate` | POST | `agreement.generate` | `admin:{id}` | Generation result / existing draft |
| `/api/admin/agreement/:leadId/approve` | PATCH | `agreement.approve` | `admin:{id}` | Agreement approval snapshot |
| `/api/admin/retention/run` | POST | `retention.run` | `admin:{id}` | Run summary |
| `/api/admin/retention/actions` | POST | `retention.action` | `admin:{id}` | Action result |

## Create commands

| Command | Duplicate risk without idempotency | Protected |
| ------- | -------------------------------- | --------- |
| Intake submit | New lead/intake/booking/payment/sync | Yes |
| DSAR create (account/public) | Duplicate privacy requests | Yes |
| Agreement generate | Duplicate draft rows | Yes |
| Docketwise sync (unconfigured) | Duplicate sync upserts | Yes |

## State-transition commands

| Command | Duplicate risk | Protected |
| ------- | -------------- | --------- |
| Payment status / hosted URL | Double audit / conflicting URLs | Yes |
| Admin role change / user delete | Double audit / double delete attempt | Yes |
| DSAR anonymize | Second deletion workflow | Yes (service guard + idempotency) |
| Agreement approve | Double approval side effects | Yes |
| Retention run/action | Double purge batches | Yes |

## External-effect commands

| Command | External effect | Idempotency status |
| ------- | --------------- | ------------------ |
| Email verification send | Email provider | Token single-use (separate control) |
| DSAR anonymize | File deletion on disk | **Partial** — API deduped; file delete not transactional with DB |
| Docketwise sync (configured) | Provider HTTP | **Not verified** — adapter not implemented |
| Payment provider webhooks | Provider callbacks | **Not implemented** — no webhook route |

## Naturally idempotent (no key required)

- GET/read endpoints
- Logout (safe repeat)
- Setting a field to the same value where service already no-ops
- DSAR anonymize when request already `processing`/`completed` (service short-circuit)

## Booking note

`POST /api/account/booking` remains a stub (`not_configured`) with no persistence; idempotency not applied until a real booking command exists.
