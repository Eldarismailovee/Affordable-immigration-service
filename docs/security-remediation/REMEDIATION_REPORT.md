# Security Remediation Report

Date: 2026-07-06

## 1. Executive summary

Critical privilege escalation in public registration (**AUTH-001**) has been removed. Primary P1 business/privacy/integration findings (**PRIV-001**, **BUS-001**, **BUS-002**, **DEP-001**) received code fixes, migrations, and regression tests. Selected P2 controls (**DB-001**, **API-001**, **BUS-003**, **BUS-004**) were implemented in the same pass. Full Medium/Low backlog, MFA, idempotency, CI hardening, browser headers, PDF queue limits, and production ops evidence remain open.

**New verdict: PARTIAL**

## 2. Initial audit verdict

`FAIL` — 1 Critical, 5 High, 14 Medium, 1 Low (16 CONFIRMED).

## 3. Repository snapshot

| Item | Value |
|------|-------|
| Base commit | `672b74e8d8418d9fc1cdff12d439936f35e38176` |
| Branch | `main` |
| Working tree | Dirty (pre-existing UX/trust + audit docs + remediation changes) |
| Node.js | v26.2.0 |
| npm | 11.13.0 |
| Docker | 29.6.1 |
| Lockfiles | `backend/package-lock.json`, `frontend/package-lock.json` (multer updated in backend lock) |

## 4. Fixed Critical findings

### AUTH-001 — FIXED

- Public registration always assigns `user` role.
- Removed first-user admin bootstrap from `auth.service.js`.
- Removed automatic `seedInitialAdmin()` from server startup.
- Added `backend/scripts/create-initial-admin.js` (transactional, advisory lock, password policy, audit event).
- `registerSchema` is `.strict()` to reject mass-assignment of privileged fields.

## 5. Fixed High findings

| Finding | Status | Notes |
|---------|--------|-------|
| PRIV-001 | FIXED | Full deletion manifest, verification query, honest `processing`/`completed`/`partially_completed`/`failed` states |
| BUS-001 | FIXED | Case-review fields persisted end-to-end + migration 015 |
| BUS-002 | FIXED | Docketwise sync no longer fabricates `synced`; returns `not_configured` when provider absent |
| DEP-001 | FIXED | `multer@2.2.0` installed; parser limits added |
| AUTH-002 | BLOCKED | MFA not implemented (requires auth architecture migration plan) |

## 6. Partially fixed Medium/Low (this pass)

| Finding | Status |
|---------|--------|
| DB-001 | FIXED — audit errors propagate inside DB transactions |
| API-001 | FIXED — production requires non-empty payment host allowlist; HTTPS/private-host/credential checks |
| BUS-003 | PARTIALLY_FIXED — booking returns `not_configured`, no persistence yet |
| BUS-004 | PARTIALLY_FIXED — email stub reports `not_configured` outside test env |
| AUTH-003 | PENDING |
| BUS-005 | PENDING |
| DATA-001 | FIXED — see `docs/security-remediation/browser-storage/` |
| DATA-002 | PENDING |
| DOS-001 | PENDING |
| OPS-001 | NOT_VERIFIED |
| CI-001 | PENDING |
| API-002 | PENDING |
| LOG-001 | PENDING |
| CONT-001 | PENDING |
| CRYPTO-001 | PENDING |

## DATA-001 — Sensitive Browser Storage (FIXED)

- Removed `immigration-intake` localStorage persistence; intake PII now memory-only (public) or server-side drafts (authenticated).
- Centralized `safeBrowserStorage.js` allowlist; legacy cleanup version 2 on boot and logout.
- Refresh token remains HttpOnly cookie; access token memory-only.
- `Cache-Control: no-store` on `/api/auth`, `/api/account`, `/api/admin`.
- Migration `020_secure_intake_drafts.sql`; DSAR deletion includes draft rows.
- Browser E2E: NOT_VERIFIED_BROWSER_E2E.


- No automatic admin on empty DB.
- Operator-only initial admin script documented in `backend/scripts/create-initial-admin.js`.
- Strict registration schema.

## 8. Authorization changes

- Test helpers updated to promote admin/attorney explicitly (reflects real provisioning model).

## 9. Privacy/DSAR changes

- Deletion workflow: DB transaction → file cleanup → post-condition verification → honest final status.
- Generic `completed` transition blocked for deletion request types.
- Child tables (intakes, bookings, payments, agreements, onboarding, conflict checks, tokens, suppressions, cookie logs, DSAR exports) included in manifest.

## 10. Data model/migrations

See `MIGRATION_NOTES.md`.

## 11. Integration status changes

- Docketwise: `not_configured` / honest failure; no fake external IDs.
- Email/booking: honest non-delivery when providers not configured.

## 12. Dependency updates

- `multer` 2.1.1 → 2.2.0 (CVE-2026-5079, CVE-2026-5038 addressed for reachable path).

## 13. Upload security

- Multer upgraded; `fieldNestingDepth`, `fields`, `parts`, `headerPairs` limits set.

## 14. Container/CI changes

- None in this pass (CI-001 remains open).

## 15. Regression tests added

- Auth role assignment, strict register schema, password policy
- Intake contract (case-review fields)
- Docketwise admin honest status
- Hosted payment URL hardening
- DSAR anonymization mock updated for new workflow
- Test helper `authTestHelpers.js`, `intakeTestPayload.js`

## 16. Verification results

## AUTH-002 MFA pass (2026-07-06)

| Suite | Result |
| ----- | ------ |
| Backend | 328 pass, 0 fail, 1 skipped (PG integration) |
| Frontend | 93 pass (includes 5 MFA static tests) |
| Lint/build | PASS |

See `docs/security-remediation/mfa/TEST_RESULTS.md`.

## 17. Remaining risks

See `REMAINING_RISKS.md`.

## 18. New verdict

**PARTIAL** — P0 and primary P1 closed in code with tests; MFA, idempotency, CI, headers, PDF limits, localStorage PII, and production ops evidence still block staging/production authorization.

---

## AUTH-002 MFA remediation (2026-07-06)

### Status: FIXED

Implemented TOTP MFA for privileged roles (`admin`, `attorney`):

- Opaque MFA challenge tokens (server-side, single-use, TTL 300s)
- AES-256-GCM encrypted TOTP secrets
- Recovery codes (scrypt, one-time)
- JWT `mfa`, `mfaAt`, `secVer` claims
- `requirePrivilegedMfa` on `/api/admin`
- Step-up middleware on DSAR export/deletion, role changes, audit, retention, site settings
- Frontend login → verify/enroll flows
- Migration `017_privileged_mfa.sql`
- 12 dedicated MFA API tests; backend suite **328 pass** (1 PG test skipped)

### Updated verdict

**PARTIAL** — AUTH-002 closed; remaining Medium/Low findings (AUTH-003, CI-001, etc.) still open.

---

## AUTH-003 — Verified Email Gate (2026-07-06)

### Scope

Server-side verified-email enforcement for sensitive user and admin flows; hardened verification tokens; pending email change; honest provider semantics; frontend verify/change-email UX.

### Key changes

- Migration `018_email_verification_security.sql`
- `requireVerifiedEmail` on `/api/account/**` and `/api/admin/**`
- Privileged login requires verified email before MFA (AUTH-002 preserved)
- Opaque hashed tokens with purpose, TTL, invalidation
- Variant B pending email change flow
- Rate limits for resend/verify/change
- Initial admin: verification + MFA required; `--password-stdin` / `--password-file`

### Tests

- Backend: **336 pass** (includes `email-verification.api.test.js`)
- Frontend: **99 pass** (includes `emailVerification.test.js`)
- PostgreSQL 018 integration: `NOT_VERIFIED_ENVIRONMENT`

### Verdict

**AUTH-003: FIXED**

---

## CI-001 — Blocking CI and Security Gates (2026-07-06)

### Scope

Reproducible blocking CI: SHA-pinned Actions, `ci-required` aggregate, frontend tests in CI, production npm audit with baselines, Gitleaks, CodeQL, actionlint, Dependency Review, PostgreSQL integration on main, Docker build/scan/smoke, Dependabot, CODEOWNERS template.

### Key changes

- `.github/workflows/ci.yml` — full PR/main pipeline + `ci-required`
- `.github/workflows/security-scheduled.yml` — informational DAST/SBOM/audit
- `.github/workflows/release-readiness.yml` — manual gate
- `scripts/ci/*` — audit, container scan, workflow validation, compose smoke
- `security/*-baseline.json` — expiring exception policy
- Dependency fixes: ws override, react-router-dom 7.18.1, vite 8.1.3

### Tests

- Backend: **336 pass** (2 PG skip without flags)
- Frontend: **99 pass**, lint, build PASS
- workflow-policy.test.js: **6 pass**
- Docker build: PASS (local)

### Verdict

**CI-001: REPOSITORY_FIXED_REMOTE_ENFORCEMENT_NOT_VERIFIED**

Apply `docs/security-remediation/ci/GITHUB_SETTINGS_RUNBOOK.md` to complete remote enforcement.

---

## BUS-005 — Sensitive Command Idempotency (2026-07-06)

### Status: CORE_DATABASE_COMMANDS_FIXED / EXTERNAL_EFFECT_IDEMPOTENCY_NOT_VERIFIED

Implemented server-side idempotency for mandatory scope:

- Migration `019_idempotency_records.sql`
- HMAC-scoped keys, canonical request hash, atomic transaction with business mutations
- Protected: intake, DSAR create/anonymize/export, payments, admin user/MFA, Docketwise sync, agreement, retention
- Frontend retry layer with stable in-memory keys
- Backend: **348 pass**; Frontend: **106 pass**
- CI: `RUN_IDEMPOTENCY_PG_INTEGRATION=1` in postgres-integration job

Documentation: `docs/security-remediation/idempotency/`

Remaining: payment webhooks, configured Docketwise HTTP, email provider sends, DSAR file deletion outside DB transaction, production cleanup scheduler.

