# Privacy and PII Review

## PII inventory

| Данные | Где поступают | Где хранятся | Где логируются | Retention | Удаление |
|---|---|---|---|---|---|
| Name/email/phone | register/intake | users, leads, payments, generated HTML | email hash in audit; URLs/access logs | lead policy | partially anonymized |
| Immigration matter, notes | case review/intake | intakes, conflict checks, documents | redacted metadata only intended | lead/document policy | not handled by DSAR deletion |
| Relationship/location/deadline | case-review frontend | `localStorage` only; stripped by backend | browser storage | unbounded until reset | browser reset only |
| Booking time/type | intake | bookings | not intended | inherited/undefined | not handled by DSAR deletion |
| Billing contact/notes | intake | payments | not intended | undefined | not handled by DSAR deletion |
| Agreement/onboarding HTML | generated | DB; PDF generated in memory | document audit event | document policy | retention job can blank; DSAR does not |
| DSAR email/message/changes | public/account DSAR | dsar_requests/events/export JSON | audit metadata | no deletion policy found | DSAR deletion does not clear own row |
| DSAR PDF | admin export | local volume, optionally AES-GCM | path in DB | undefined | no DSAR cleanup/unlink |
| Auth/reset/verification tokens | auth | SHA-256 token hashes, refresh metadata | unsubscribe token appears in URL logs | cleanup job exists | refresh revoked; DSAR leaves one-time rows until expiry cleanup |
| IP/user agent | requests/consent | cookie logs, audit hashes, refresh rows | application/access logs | 90/365-day defaults | retention runner, not scheduled |
| Admin-uploaded images | admin | public volume | filename/URL | undefined | no delete endpoint/retention |

## DSAR deletion post-condition

`applyDsarAnonymization()` invokes only:

1. `anonymizeLeadsForUserId()` — replaces lead name/email/phone;
2. `anonymizeUserById()` — replaces account identity and disables it;
3. `revokeUserRefreshTokens()`.

It does **not** clear intake notes/case type, booking time, billing identity/notes, conflict-check parties/summary, agreement/onboarding HTML/review notes, Docketwise external IDs, email suppression records, verification/reset tokens, audit metadata, DSAR requester email/message/changes/export JSON, or exported PDF files. It then writes `status='completed'` without a verification query. The generic status endpoint can also set `completed` independently of deletion.

The separate retention engine can anonymize some lead/conflict/document fields later, but is not invoked by DSAR, does not cover all child tables, and has no confirmed scheduler. Therefore it is not a compensating control for the required immediate post-condition.

## Browser and external privacy

- `frontend/src/context/IntakeContext.jsx:3-45` persists full intake, agreement preview and submission result in `localStorage` without TTL or logout cleanup.
- Access token is memory-only and refresh token is HttpOnly cookie: token-in-localStorage hypothesis is false.
- Google Fonts is requested from Google before consent; production privacy/legal basis was not verified.
- URLs are logged; the GET unsubscribe token is therefore present in application/reverse-proxy access logs.

## Retention and backups

Retention code and admin/CLI entry points exist. There is no Compose cron/worker or deployment schedule. `docs/security/backup-restore-runbook.md` retains TODOs for provider, frequency, RPO/RTO and restore drill. Backup copies and provider deletion are `NOT_VERIFIED`.

## Required remediation

Create a deletion manifest per data subject, execute it in a resumable workflow, clear all DB/file/provider locations, preserve only explicitly approved legal-hold/statutory fields, verify post-conditions, and only then transition to `completed`. Browser intake should move to memory/session-scoped storage with explicit expiry and logout/success cleanup.
