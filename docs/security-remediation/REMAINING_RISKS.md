# Remaining Risks

## Blocked / not implemented

| Finding | Reason |
|---------|--------|
| AUTH-002 MFA | Requires TOTP/WebAuthn architecture, enrollment UX, staff migration |
| BUS-005 Idempotency | **CORE_DATABASE_COMMANDS_FIXED** — see `docs/security-remediation/idempotency/`; external provider idempotency not verified |
| OPS-001 Production TLS/backup | Requires production infrastructure evidence |

## Partially fixed

| Finding | Gap |
|---------|-----|
| BUS-003 Booking | Returns honest `not_configured`; no durable booking persistence |
| BUS-004 Email | Honest status in dev; production still needs real provider + queue |
| PRIV-001 DSAR | File deletion best-effort outside DB TX; no durable retry worker |

## Not verified in this environment

- Live PostgreSQL DSAR deletion integration + rollback fault injection
- Docker image build/run smoke
- DAST blocking CI
- Production nginx/TLS/HSTS headers (API-002)

## Open Medium/Low (unchanged)

- AUTH-003 email verification gate
- ~~DATA-001 localStorage intake PII~~ **FIXED** (2026-07-06 browser-storage pass)
- DATA-002 DSAR export encryption mandatory in production
- DOS-001 PDF queue bounds
- CI-001 pipeline gates — **REPOSITORY_FIXED** (remote enforcement pending)
- LOG-001 unsubscribe token in URLs
- CONT-001 Chromium sandbox/resources
- CRYPTO-001 JWT iss/aud

## Dependency advisories (post-multer fix)

- Transitive `qs` (moderate) via express/body-parser
- ~~Transitive `ws` (high) via puppeteer-core~~ — fixed via npm overrides (CI-001)

## CI-001 follow-up

- Configure branch protection required checks (`ci-required`, CodeQL, Dependency Review)
- Replace `@org/security-team` in CODEOWNERS
- Review first main-branch Trivy scan for container baselines

## Audit discrepancy

- `seedInitialAdmin.js` remains in repo but is no longer invoked at startup; use `create-initial-admin.js` instead. Consider deprecating env-based `ADMIN_EMAIL`/`ADMIN_PASSWORD` bootstrap in a follow-up.
