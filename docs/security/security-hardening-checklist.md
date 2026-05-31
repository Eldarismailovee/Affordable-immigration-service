# Security hardening checklist

Production readiness checklist for Affordable Immigration Service.

## Authentication and sessions

- [x] Access token held in memory only (frontend `api.js`)
- [x] Refresh token in HttpOnly cookie (`backend/src/utils/authCookies.js`)
- [x] Refresh cookie `Secure` in production
- [x] Refresh cookie `SameSite=Lax`, `Path=/`
- [x] Production cookie name `__Host-refresh_token`
- [x] Refresh token not returned in JSON responses
- [x] Logout clears refresh cookie
- [ ] Confirm production HTTPS termination and `trust proxy` on backend

## HTTP security headers

- [x] Content-Security-Policy enabled in production (Helmet)
- [x] `object-src 'none'`, `frame-ancestors 'none'`
- [x] HSTS in production (Helmet)
- [x] `X-Content-Type-Options: nosniff`
- [x] Referrer-Policy configured
- [x] Permissions-Policy restricts camera/microphone/geolocation/payment
- [ ] Confirm HSTS at reverse proxy (nginx) when TLS is enabled — see `deploy/nginx.conf` TODO

## Data at rest

- [x] DSAR export PDFs support AES-256-GCM when `DOCUMENT_ENCRYPTION_KEY_BASE64` is set
- [ ] Configure `DOCUMENT_ENCRYPTION_KEY_BASE64` in production secret manager
- [ ] Confirm PostgreSQL provider encryption at rest
- [ ] Confirm upload volume / object storage encryption
- [ ] Run encrypt-existing-documents script if migrating from plaintext DSAR files

## Operations

- [x] Backup / restore runbook exists (`backup-restore-runbook.md`)
- [ ] Confirm backup provider and frequency
- [ ] Restore drill tested (monthly/quarterly TODO)
- [x] Incident response plan exists (`incident-response-plan.md`)
- [ ] Assign incident response contacts

## CI / scanning

- [x] `npm audit --audit-level=high` in CI
- [x] CodeQL workflow (`.github/workflows/codeql.yml`)
- [x] DAST baseline workflow (`.github/workflows/dast-baseline.yml`) — warn-only initially
- [ ] Enable GitHub secret scanning / push protection in repo settings
- [ ] Tune ZAP baseline after first report

## Development vs production

| Control | Development | Production |
|---------|-------------|------------|
| CSP | Disabled (Vite HMR) | Strict `'self'` baseline |
| Refresh cookie name | `refresh_token` | `__Host-refresh_token` |
| Cookie `Secure` | false | true |
| HSTS | off | 1 year |
| Document encryption | optional | recommended for DSAR exports |

## Related documents

- [document-encryption-at-rest.md](./document-encryption-at-rest.md)
- [backup-restore-runbook.md](./backup-restore-runbook.md)
- [incident-response-plan.md](./incident-response-plan.md)
- [secret-scanning.md](./secret-scanning.md)
- [dast-runbook.md](./dast-runbook.md)
