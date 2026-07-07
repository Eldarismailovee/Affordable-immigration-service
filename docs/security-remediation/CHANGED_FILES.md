# Changed Files — Security Remediation

| Файл | Findings | Изменение | Причина |
| ---- | -------- | --------- | ------- |
| `backend/src/services/auth.service.js` | AUTH-001 | Always `USER_ROLE`; removed bootstrap | Close privilege escalation |
| `backend/src/schemas/auth.schema.js` | AUTH-001 | `.strict()` on register | Reject role mass-assignment |
| `backend/src/server.js` | AUTH-001 | Removed `seedInitialAdmin()` call | No auto admin on startup |
| `backend/scripts/create-initial-admin.js` | AUTH-001 | New operator script | Controlled admin provisioning |
| `backend/src/utils/passwordPolicy.js` | AUTH-001 | New password policy helper | Secure admin provisioning |
| `backend/src/services/dsar-deletion.service.js` | PRIV-001 | New deletion orchestrator | Honest DSAR erasure |
| `backend/src/repositories/dsar-deletion.repository.js` | PRIV-001 | New PII cleanup + verification SQL | Full data inventory |
| `backend/src/services/dsar-anonymization.service.js` | PRIV-001 | Delegates to deletion workflow | Single deletion entry point |
| `backend/src/services/dsar.service.js` | PRIV-001 | Processing/verification/completion logic | No false `completed` |
| `backend/src/constants/dsar.js` | PRIV-001 | New statuses/transitions/events | State machine |
| `backend/src/repositories/dsar.repository.js` | PRIV-001 | Deletion metadata columns | Track failures/verification |
| `backend/src/db/migrations/016_dsar_deletion_workflow.sql` | PRIV-001 | DSAR status + columns | Schema support |
| `backend/src/schemas/intake.schema.js` | BUS-001 | Case-review fields + strict | Contract alignment |
| `backend/src/services/intake.service.js` | BUS-001 | Persist/map fields | Stop silent loss |
| `backend/src/repositories/lead.repository.js` | BUS-001 | Intake columns in SQL | Persistence |
| `backend/src/utils/intakeResponse.js` | BUS-001 | Return new fields | Round-trip |
| `backend/src/db/migrations/015_case_review_and_docketwise_statuses.sql` | BUS-001, BUS-002 | Columns + status constraints | DB contract |
| `backend/src/constants/domain.js` | BUS-002 | Extended Docketwise statuses | Honest integration states |
| `backend/src/services/docketwise-admin.service.js` | BUS-002 | No fake sync | Integration integrity |
| `backend/package.json` | DEP-001 | multer ^2.2.0 | CVE remediation |
| `backend/package-lock.json` | DEP-001 | Lock update | Pin fixed version |
| `backend/src/middleware/upload.middleware.js` | DEP-001 | Parser limits | Defense in depth |
| `backend/src/services/audit.service.js` | DB-001 | Propagate audit errors in TX | Prevent false success |
| `backend/src/utils/hostedPaymentUrl.js` | API-001 | Fail-closed allowlist, host checks | Payment URL safety |
| `backend/src/config/env.js` | API-001, BUS-004 | Production allowlist gate; provider flags | Secure defaults |
| `backend/src/services/payment.service.js` | API-001 | `requireAllowlist` in production | Enforce allowlist |
| `backend/src/services/booking.service.js` | BUS-003 | `not_configured` status | Honest booking state |
| `backend/src/services/email.service.js` | BUS-004 | `not_configured` delivery status | Honest email state |
| `backend/src/services/email-verification.service.js` | BUS-004 | Honest verification messaging | No false sent |
| `backend/src/services/password-reset.service.js` | BUS-004 | Honest reset messaging | No false sent |
| `backend/tests/**` | Multiple | Regression + helper updates | Verify fixes |
| `docs/security-remediation/**` | — | Remediation artifacts | Audit trail |
| `.github/workflows/ci.yml` | CI-001 | Blocking CI + ci-required | Merge gates |
| `.github/workflows/security-scheduled.yml` | CI-001 | Scheduled security | Informational scans |
| `.github/workflows/release-readiness.yml` | CI-001 | Manual release gate | Pre-deploy checklist |
| `.github/dependabot.yml` | CI-001 | Dependabot ecosystems | Dependency hygiene |
| `.github/CODEOWNERS` | CI-001 | CI/security ownership template | Review enforcement |
| `.gitleaks.toml` | CI-001 | Secret scan config | Gitleaks policy |
| `scripts/ci/**` | CI-001 | Audit/validation/smoke scripts | Fail-closed gates |
| `security/*-baseline.json` | CI-001 | Expiring exceptions | Controlled audit policy |
| `tests/ci/workflow-policy.test.js` | CI-001 | CI regression tests | Policy enforcement |
| `backend/package.json` | CI-001 | ws override | Fix transitive high |
| `frontend/package.json` | CI-001 | react-router, vite, ws override | Fix transitive high |

## BUS-005 — Idempotency (2026-07-06)

| File | Change |
| ---- | ------ |
| `backend/src/db/migrations/019_idempotency_records.sql` | Idempotency table |
| `backend/src/constants/idempotency.js` | Operations + error codes |
| `backend/src/config/idempotency.js` | HMAC secret + TTL config |
| `backend/src/utils/canonicalRequestHash.js` | Canonical payload hash |
| `backend/src/utils/idempotencyKey.js` | Key validation + fingerprint |
| `backend/src/repositories/idempotency.repository.js` | DB access |
| `backend/src/services/idempotency.service.js` | Transaction algorithm |
| `backend/src/middleware/idempotency.js` | Header middleware |
| `backend/src/utils/idempotentCommand.js` | HTTP command wrapper |
| `backend/scripts/idempotency-cleanup.js` | Retention cleanup job |
| `frontend/src/services/idempotency.js` | Client retry keys |
| `frontend/src/services/api.js` | Idempotent request helpers |
| `docs/security-remediation/idempotency/*` | Full documentation |
| `.github/workflows/ci.yml` | PG integration flag |
| `backend/tests/**/idempotency*` | Regression + PG tests |

## DATA-001 — Sensitive browser storage (2026-07-06)

| File | Change |
| ---- | ------ |
| `frontend/src/services/safeBrowserStorage.js` | Allowlisted localStorage |
| `frontend/src/services/legacyStorageCleanup.js` | Versioned legacy key purge |
| `frontend/src/context/IntakeContext.jsx` | Memory + server draft autosave |
| `frontend/src/context/AuthContext.jsx` | Logout cleanup, multi-tab sync |
| `frontend/src/lib/cookieConsent.js` | `ais.ui.cookieConsent` key |
| `backend/src/db/migrations/020_secure_intake_drafts.sql` | Draft table |
| `backend/src/repositories/intake-draft.repository.js` | Draft CRUD |
| `backend/src/middleware/noStore.js` | Sensitive API cache headers |
| `docs/security-remediation/browser-storage/*` | Full DATA-001 documentation |

