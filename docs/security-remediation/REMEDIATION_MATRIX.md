# Security Remediation Matrix

Snapshot: commit `672b74e8d8418d9fc1cdff12d439936f35e38176`, branch `main`, dirty working tree.

| Finding | Severity | Текущий статус | Затронутые файлы | План исправления | Tests | Итог |
| ------- | -------- | -------------- | ---------------- | ---------------- | ----- | ---- |
| AUTH-001 | Critical | FIXED | auth.service.js, server.js, create-initial-admin.js, auth.schema.js, auth tests | Always USER_ROLE; operator script | auth.service.test.js, auth.api.test.js, auth.schema.test.js, passwordPolicy.test.js | FIXED |
| AUTH-002 | High | FIXED | mfa.*, migration 017, auth/session, admin step-up, frontend MFA pages | TOTP MFA + step-up for admin/attorney | mfa.api.test.js (12), full suite 328 pass | FIXED |
| PRIV-001 | High | FIXED | dsar-deletion.*, dsar.service.js, migration 016 | Manifest + verification + honest states | dsar.service.test.js (unit) | FIXED |
| BUS-001 | High | FIXED | intake.schema.js, intake.service.js, lead.repository.js, migration 015 | Persist relationship/location/deadline | intake.contract.test.js | FIXED |
| BUS-002 | High | FIXED | docketwise-admin.service.js, domain.js, migration 015 | No false synced | docketwise-admin.service.test.js | FIXED |
| DEP-001 | High | FIXED | package.json, upload.middleware.js | multer ≥2.2.0 + limits | existing upload tests pass | FIXED |
| AUTH-003 | Medium | FIXED | email-verification.*, migration 018, auth.js middleware, frontend verify pages | Server verified-email gate + token hardening | email-verification.api.test.js, emailVerification.test.js | FIXED |
| BUS-003 | Medium | PARTIAL | booking.service.js | not_configured response | — | PARTIALLY_FIXED |
| BUS-004 | Medium | PARTIAL | email.service.js, email-verification-delivery.js | Honest delivery states | email-verification.api.test.js | PARTIALLY_FIXED |
| BUS-005 | Medium | CORE_DATABASE_COMMANDS_FIXED | idempotency/*, migration 019, middleware, frontend idempotency.js | Scoped keys + atomic DB commands | idempotency.api.test.js, idempotency.integration.test.js | CORE_DATABASE_COMMANDS_FIXED |
| DATA-001 | Medium | FIXED | IntakeContext, safeBrowserStorage, intake-draft API, migration 020 | Server drafts + memory-only public forms; legacy cleanup | browserStoragePolicy.test.js, intake-draft.api.test.js | FIXED |
| DATA-002 | Medium | OPEN | document-storage, env | Fail closed production | — | PENDING |
| DB-001 | Medium | FIXED | audit.service.js, payment.service.js | Propagate audit TX errors | payment tests pass | FIXED |
| DOS-001 | Medium | OPEN | pdf.service.js | Bounded queue | — | PENDING |
| API-001 | Medium | FIXED | hostedPaymentUrl.js, env.js | Production allowlist required | hostedPaymentUrl.test.js, env.test.js | FIXED |
| OPS-001 | Medium | UNCHANGED | — | Production evidence | — | NOT_VERIFIED |
| CI-001 | Medium | REPOSITORY_FIXED_REMOTE_ENFORCEMENT_NOT_VERIFIED | .github/workflows, scripts/ci, security/* | Blocking gates + ci-required aggregate | workflow-policy.test.js, validate-workflows.js | REPOSITORY_FIXED |
| API-002 | Medium | OPEN | nginx configs | Security headers | — | PENDING |
| LOG-001 | Medium | OPEN | unsubscribe, httpLogger | Token redaction/POST | — | PENDING |
| CONT-001 | Medium | OPEN | pdf.service.js, docker | Sandbox + limits | — | PENDING |
| CRYPTO-001 | Low | OPEN | auth.js JWT | iss/aud | — | PENDING |
