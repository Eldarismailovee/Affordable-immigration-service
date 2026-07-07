# Security Findings

Дата проверки: 2026-07-06. Итог: 21 finding — 1 Critical, 5 High, 14 Medium, 1 Low. Статусы: 16 `CONFIRMED`, 4 `HIGH_CONFIDENCE`, 1 `NOT_VERIFIED`.

CVSS 4.0 приведён только там, где модель применима к техническому attack path. Пометка `N/A` означает business/process/control failure, для которого числовой CVSS создал бы ложную точность. Предварительные баллы отмечены явно: локальный CVSS 4.0 calculator был недоступен, а установка дополнительного инструмента не была разрешена/завершена.

## AUTH-001 — Первый публично зарегистрированный пользователь получает admin

Severity: **Critical**  
Priority: **P0**  
Status: **CONFIRMED**  
Confidence: **High**  
CVSS 4.0: **9.3 preliminary** — `CVSS:4.0/AV:N/AC:L/AT:P/PR:N/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H`  
CWE: CWE-269, CWE-284  
OWASP Top 10:2025: Broken Access Control  
OWASP API Security: API5:2023  
ASVS 5.0: V4 Access Control  
Affected component/endpoints: `POST /api/auth/register`, registration service  
Affected roles/data: anonymous → admin; all admin-accessible PII and operations

### Описание

Public registration is rate-limited but intentionally maps the first database user to `ADMIN_ROLE`. The role is then embedded in a freshly returned authenticated session. This is public privilege escalation on any empty, restored, misconfigured or race-affected database.

### Предусловия атаки и attack scenario

The users table has zero visible rows. An unauthenticated attacker submits one ordinary valid registration. `getInitialRole()` observes zero, `createUser()` persists `admin`, and `createAuthSession()` returns working credentials. No client-supplied role, secret bootstrap token, MFA or operator approval is required.

### Evidence и безопасное воспроизведение

- `backend/src/routes/auth/index.js:12` exposes the route without authentication.
- `backend/src/services/auth.service.js:34-36,54-94` performs count → role selection → insert → session.
- `backend/tests/services/auth.service.test.js:148-170` explicitly passes with first user as admin.
- Schema PoC with top-level/nested `role:"admin"` showed those fields stripped; this does **not** mitigate the server-selected role.

Фактический результат: first registration receives admin. Ожидаемый: public registration always creates an unprivileged user. Cleanup: unit/service PoC used mocks and created no persistent account.

### Impact и controls

The attacker can reach privileged lead, document, payment, DSAR, retention, upload and settings functions. IP rate limiting and frontend guards do not prevent the first valid request; role middleware trusts the role created by this path.

### Рекомендация, критерий исправления и regression test

Remove bootstrap behavior from public registration. Create the initial admin only through a one-time deployment command with an out-of-band secret, transaction/advisory lock, explicit audit and fail-closed lifecycle. Inspect provenance of existing admins and rotate uncertain credentials. Acceptance: on an empty DB, one and concurrent public registrations all become `user`; bootstrap is non-HTTP, single-use, audited and cannot race.

## AUTH-002 — Нет MFA для staff/admin

Severity: **High**  
Priority: **P1**  
Status: **HIGH_CONFIDENCE**  
Confidence: **High**  
CVSS 4.0: **N/A — absence of a defense, not an independently exploitable primitive**  
CWE: CWE-308  
OWASP Top 10: Authentication Failures  
OWASP API Security: API2:2023  
ASVS 5.0: V6 Authentication  
Affected component/endpoints: login/session and every staff/admin endpoint

### Описание и attack scenario

No TOTP, WebAuthn/passkey, recovery-code, enrollment or step-up flow exists. One stolen/reused admin password grants a privileged session; `AUTH-001` makes this boundary still more consequential.

### Evidence

- `backend/src/routes/auth/`, `backend/src/services/auth.service.js` and migrations contain password/token flows but no second factor.
- Repository-wide search for MFA/TOTP/WebAuthn found no implementation.
- `backend/src/schemas/auth.schema.js:3-21` accepts password-only registration/login/reset.

Controls: scrypt, generic reset response, refresh rotation/reuse detection, HttpOnly refresh cookie and role middleware reduce adjacent risks but are not MFA. Dynamic account takeover was not attempted.

### Рекомендация и acceptance

Require phishing-resistant MFA for staff/admin, recovery codes, audited enrollment/revocation and step-up for role, DSAR export/deletion and payment changes. Migration must force existing privileged users through enrollment. Regression: password-only privileged login cannot obtain a privileged session; recovery and factor reset require a separately controlled process.

## PRIV-001 — DSAR deletion marks completed while PII remains

Severity: **High**  
Priority: **P1**  
Status: **CONFIRMED**  
Confidence: **High**  
CVSS 4.0: **N/A — privacy/business workflow failure**  
CWE: CWE-459, CWE-664  
OWASP Top 10: Software/Data Integrity Failures  
OWASP API Security: API8:2023  
ASVS 5.0: V14 Data Protection  
Affected endpoints: admin DSAR anonymization/status operations  
Affected data: identity, legal matter, billing, booking, documents, exports and request history

### Описание

Deletion only anonymizes lead contact fields and the user row and revokes refresh tokens. It then writes `completed` without transaction-wide erasure or a verification query. A generic status operation can independently set deletion requests to `completed`.

### Предусловия и attack scenario

An admin processes a verified deletion request normally, or changes its status. The subject receives a completed state while substantial PII remains queryable or on disk.

### Evidence

- `backend/src/services/dsar-anonymization.service.js:5-9` calls only three cleanup functions.
- `backend/src/repositories/lead.repository.js:440-455` changes only lead name/email/phone.
- `backend/src/services/dsar.service.js:578-627` anonymizes, then unconditionally completes.
- `backend/src/services/dsar.service.js:724-786` supports generic `completed` transition.
- PII inventory and uncovered stores are enumerated in `PRIVACY_REVIEW.md`.

Фактический результат: PII remains in intake/case notes, booking, payment, conflict/document HTML, tokens/audit metadata, DSAR record/export JSON and exported PDF. Ожидаемый: no erasable PII remains after `completed`, except documented legal hold/statutory retention. No destructive live PoC was run.

### Controls, recommendation and acceptance

Identity verification, legal-hold checks and a separate retention engine are useful, but retention is neither invoked nor confirmed scheduled and does not cover all stores. Implement a transactional/resumable deletion manifest, child/file/provider cleanup, legal exceptions, retry/failure state and post-condition query; prohibit generic completion for deletion. Regression seeds every store and asserts either erased/anonymized, retained with reason, or request remains failed/partial—not completed.

## BUS-001 — Case-review fields are silently discarded

Severity: **High**  
Priority: **P1**  
Status: **CONFIRMED**  
Confidence: **High**  
CVSS 4.0: **N/A — legal-service data integrity failure**  
CWE: CWE-20, CWE-840  
OWASP Top 10: Insecure Design  
OWASP API Security: API3/API6:2023  
ASVS 5.0: V2 Validation and Business Logic  
Affected component: final intake submission  
Affected data: relationship, location/jurisdiction, urgent deadline and notes

### Описание, scenario и evidence

The frontend collects `petitionRelationship`, `location`, `hasUrgentDeadline` and `urgentDeadlineNotes`; the backend Zod schema omits them and default `z.object()` behavior strips them. Persistence also has no mapping/columns. A client can submit apparently complete legal intake and receive success while deadline/jurisdiction context is lost.

- `frontend/src/context/IntakeContext.jsx:5-29` defines the fields.
- `backend/src/schemas/intake.schema.js:9-37` omits them.
- `backend/src/services/intake.service.js:29-104` persists no such fields and reads stripped `payload.jurisdiction` at `106-113`.
- Safe schema PoC parsed successfully and confirmed all four properties absent.

Controls: Zod validates known fields but silent strip is the defect; frontend review does not prove server persistence.

### Recommendation, acceptance, regression and cleanup

Define a canonical contract and migration, use explicit strict/accepted fields, expose them in response/export, and add cross-layer contract tests. Acceptance: round-trip preserves each field; unknown keys fail explicitly; existing submissions are assessed for client re-contact. Cleanup: in-memory PoC only.

## BUS-002 — Docketwise returns and stores synced without a provider call

Severity: **High**  
Priority: **P1**  
Status: **CONFIRMED**  
Confidence: **High**  
CVSS 4.0: **N/A — integration/business-state integrity failure**  
CWE: CWE-345, CWE-840  
OWASP Top 10: Software/Data Integrity Failures  
OWASP API Security: API10:2023  
ASVS 5.0: V13 API and Web Service  
Affected component: admin Docketwise sync; legal lead data

### Описание, scenario и evidence

The admin sync operation generates a local `DW-*` ID, writes `SYNCED_STATUS` to two DB records and returns success. It performs no authenticated Docketwise request and receives no provider acknowledgment.

- `backend/src/services/docketwise-admin.service.js:17-70`; especially local ID at `34`, `synced` writes at `37-63`, success at `65-70`.
- No provider HTTP client or Docketwise API invocation exists in the call graph.

An operator relies on the status and assumes a time-sensitive matter reached the case system when it did not. Admin authorization controls who triggers the false transition but cannot validate delivery.

### Recommendation, acceptance, regression and cleanup

Use `pending → syncing → synced|failed`, signed/authenticated provider call, timeout, schema validation, durable provider ID, idempotency and reconciliation. Acceptance: `synced` is impossible without persisted successful provider response; network/provider failures produce retryable failure, never success. No provider request or persistent PoC data was created.

## DEP-001 — Reachable Multer 2.1.1 resource-exhaustion vulnerabilities

Severity: **High**  
Priority: **P1**  
Status: **HIGH_CONFIDENCE**  
Confidence: **High**  
CVSS 4.0: **preliminary 7.1** — `CVSS:4.0/AV:N/AC:L/AT:N/PR:H/UI:N/VC:N/VI:N/VA:H/SC:N/SI:N/SA:N`  
CWE: CWE-400, CWE-459  
OWASP Top 10: Vulnerable and Outdated Components  
OWASP API Security: API4:2023  
ASVS 5.0: V11 Business Logic/Resource Limits  
Affected component: backend admin multipart upload

### Описание и evidence

Exact installed production dependency `multer@2.1.1` is in affected ranges for CVE-2026-5079/GHSA-72gw-mp4g-v24j (nested multipart field resource exhaustion) and CVE-2026-5038/GHSA-3p4h-7m6x-2hcm (aborted disk upload cleanup). The app uses Multer parsing and disk storage. The endpoint requires admin, but `AUTH-001` provides a realistic chain.

- `backend/package-lock.json` and `npm ls` confirmed 2.1.1.
- `npm audit --omit=dev --json` reported the advisories.
- Manual route/middleware review confirmed `upload.single()` and disk storage.
- Fixed version: 2.2.0. Neither CVE appeared in CISA KEV catalog 2026.07.01.

No DoS payload was sent. File-size/type/magic-byte controls mitigate ordinary uploads but not these parser/abort paths.

### Recommendation, acceptance, regression and cleanup

Upgrade to ≥2.2.0, set small `fieldNestingDepth`, `fields`, `parts`, `headerPairs`, keep body/file limits and verify aborted-file cleanup. Acceptance: exact installed version is fixed and one bounded malformed regression terminates promptly with no residual file. Breaking-change risk: multipart parsing/limits behavior must be tested. No file or request was created, so cleanup does not apply.

## AUTH-003 — Email verification is not an access gate; credential controls are weak

Severity: **Medium**  
Priority: **P2**  
Status: **CONFIRMED**  
Confidence: **High**  
CVSS 4.0: N/A — compound authentication-control weakness  
CWE: CWE-620, CWE-307 · OWASP: Authentication Failures · API2:2023 · ASVS: V6  
Affected: registration/login/reset; anonymous and unverified users; account and legal data

### Описание, предусловия и attack scenario

Registration immediately returns a session and sensitive authorization does not require verified email. An attacker can register an address they do not control, or distribute password guesses across IPs against the eight-character/password-only boundary.

### Evidence и безопасное воспроизведение

`backend/src/services/auth.service.js:82-94` creates the session before verification; `backend/src/middleware/auth.js:18-46` checks identity/role, not `email_verified_at`; `backend/src/schemas/auth.schema.js:3-21` uses an eight-character minimum; `backend/src/middleware/rateLimit.js:13-19` is IP-only. Focused auth tests confirmed current behavior; no credential attack was performed.

### Result, impact and controls

Actual: an unverified account is fully authenticated and per-account credential abuse is not controlled. Expected: sensitive business flows require verified identity and layered abuse controls. scrypt, generic reset responses and refresh rotation materially reduce adjacent risks but do not close this path.

### Recommendation, acceptance, regression and cleanup

Gate sensitive flows on verified email, add stronger/breached-password policy, per-account plus IP/device throttling and security alerts without hard-lockout DoS. Regression: unverified users are denied sensitive actions and bounded distributed failures trigger controls. Tests used mocks; no persistent data required cleanup.

## BUS-003 — Booking endpoint returns success without persistence

Severity: **Medium** · Priority: **P2** · Status: **CONFIRMED** · Confidence: **High**  
CVSS 4.0: N/A · CWE-840 · OWASP Insecure Design · API6:2023 · ASVS V2  
Affected: `POST /api/account/booking`; authenticated users; appointment/contact data

### Описание, предусловия и attack scenario

The endpoint reports HTTP 201/`requested` without a database/provider write. A user or retrying client believes a consultation exists, repeats the request, and still receives success while no staff-visible booking exists.

### Evidence и безопасное воспроизведение

`backend/src/controllers/booking.controller.js:7-10` calls only the pure function at `backend/src/services/booking.service.js:1-8`. Two calls with one synthetic payload both returned success and no durable ID; no repository was invoked.

### Result, impact and controls

Actual: success is non-durable. Expected: 201 only after retrievable persistence/provider acknowledgment. Authentication and processing-restriction checks limit callers but cannot make the result durable.

### Recommendation, acceptance, regression and cleanup

Return explicit `not_configured`, or persist transactionally with an idempotency key. Regression must prove durable retrieval, same-key replay and failure propagation. The PoC was pure and created no cleanup obligation.

## BUS-004 — Email flows claim sent although transport is a stub

Severity: **Medium** · Priority: **P2** · Status: **CONFIRMED** · Confidence: **High**  
CVSS 4.0: N/A · CWE-840/CWE-755 · OWASP Insecure Design · API10:2023 · ASVS V6/V13  
Affected: verification, password reset and transactional/marketing email; account recovery

### Описание, предусловия и attack scenario

Any normal verification/reset request can be labelled sent although no delivery transport exists. A user waits for a nonexistent recovery message while application and audit state imply success.

### Evidence и безопасное воспроизведение

`stubSend()` always succeeds (`backend/src/services/email.service.js:22-31`); transactional send writes success audit (`34-68`); verification/reset do not await delivery and report sent (`backend/src/services/email-verification.service.js:32-43`; `backend/src/services/password-reset.service.js:37-57`). Focused unit flows confirmed the contract without sending email.

### Result, impact and controls

Actual: generated token plus stub result is treated as delivery. Expected: distinguish configured, queued, accepted, delivered and failed states. Token entropy/expiry and enumeration-safe text do not establish delivery.

### Recommendation, acceptance, regression and cleanup

Use a durable queue/provider acknowledgment, explicit `not_configured`, failure/retry handling and reconciliation. Production must fail startup if a stub can claim sent. Tests should inject provider accept/fail/timeout and assert truthful response/audit. No email or data was created in the audit.

## BUS-005 — Sensitive commands have no idempotency or replay contract

Severity: **Medium** · Priority: **P2** · Status: **CONFIRMED** · Confidence: **High**  
CVSS 4.0: N/A · CWE-799/CWE-840 · OWASP Insecure Design · API4/API6:2023 · ASVS V2  
Affected: intake, booking, DSAR/privacy and payment commands; users/admins; workflow records

### Описание, предусловия и attack scenario

A client retry, double click or replay can issue the same command twice. Intake allocates a new lead/intake/booking/payment/sync set on every accepted call; other command routes define no deterministic replay semantics.

### Evidence и безопасное воспроизведение

`backend/src/services/intake.service.js:29-103` generates new UUIDs before inserts. Repository-wide route/schema/migration search found no idempotency-key storage or request-hash constraint. The bounded booking replay PoC returned two successes. Concurrent DB writes were not attempted.

### Result, impact and controls

Actual: duplicates/repeated transitions are possible or undefined. Expected: one durable effect for one logical command. A few document/token unique indexes are unrelated and do not compensate.

### Recommendation, acceptance, regression and cleanup

Store scoped idempotency key + canonical request hash + response under a unique constraint; lock state transitions. Regression: sequential/concurrent same-key requests yield one effect; different-body key reuse returns conflict. No persistent PoC data was created.

## DATA-001 — Full legal intake PII persists in localStorage without expiry

Severity: **Medium** · Priority: **P2** · Status: **CONFIRMED** · Confidence: **High**  
CVSS 4.0: N/A — exposure depends on same-origin/local access · CWE-922/CWE-359 · OWASP Cryptographic Failures · ASVS V14  
Affected: browser origin storage; all intake users; identity/legal/billing data

### Описание, предусловия и attack scenario

The complete draft, agreement preview and result persist across browser restarts with no expiry. A same-origin compromise, extension, shared-profile user or later browser inspection can recover legal PII after the session ends.

### Evidence и безопасное воспроизведение

`frontend/src/context/IntakeContext.jsx:3-45` loads/writes the full object; only explicit reset removes it at `63-66`. Static tracing was sufficient; no real PII was entered. Auth context review confirmed the access token is memory-only and refresh token HttpOnly.

### Result, impact and controls

Actual: long-lived origin-readable PII remains until manual reset/storage clearing. Expected: minimum data, minimum lifetime and reliable completion/logout cleanup. Same-origin policy is not protection against same-origin script access.

### Recommendation, acceptance, regression and cleanup

Prefer memory; if draft recovery is required, use minimized session-scoped encrypted server storage with expiry. Add logout/success/TTL cleanup. Browser tests must assert absence after each lifecycle boundary. No audit test record required cleanup.

## DATA-002 — DSAR exports are plaintext when an optional key is absent

Severity: **Medium** · Priority: **P2** · Status: **HIGH_CONFIDENCE** · Confidence: **High**  
CVSS 4.0: N/A · CWE-311/CWE-312 · OWASP Cryptographic Failures · ASVS V14  
Affected: DSAR export volume/files; admin exports; aggregated account/legal/payment data

### Описание, предусловия и attack scenario

When the optional key is absent—the supplied Compose default—sensitive exports are written as plaintext. Filesystem/volume/snapshot read access then exposes an entire subject export.

### Evidence и безопасное воспроизведение

Plaintext branch: `backend/src/services/document-storage.service.js:18-49`; optional key: `backend/src/config/documentEncryption.js:3-14`; empty Compose default: `docker-compose.yml:55`; aggregation: `backend/src/services/dsar-export.service.js:41-76`. No export was generated because the production/local storage provenance was unverified.

### Result, impact and controls

Expected: production export storage is authenticated-encrypted with controlled keys. Actual code permits plaintext. OS/provider encryption and file modes could compensate but were not evidenced; access authorization protects API download, not raw volume access.

### Recommendation, acceptance, regression and cleanup

Fail closed in production without a managed envelope key, use restrictive modes, key IDs/rotation and migrate old files. Tests should verify ciphertext, authentication failure, rotation and startup rejection. No file was created, so no cleanup.

## DB-001 — Suppressed audit error can make a rolled-back payment look successful

Severity: **Medium** · Priority: **P2** · Status: **HIGH_CONFIDENCE** · Confidence: **High**  
CVSS 4.0: N/A · CWE-252/CWE-703 · OWASP Software/Data Integrity Failures · ASVS V8  
Affected: admin payment-status update; payment/intake state and audit integrity

### Описание, предусловия и attack scenario

An audit insert error after payment writes aborts the PostgreSQL transaction. Because the error is swallowed, the wrapper sends `COMMIT` and can return the earlier `RETURNING` object although PostgreSQL rolled the transaction back.

### Evidence и безопасное воспроизведение

Suppression: `backend/src/services/audit.service.js:42-81`; same client after writes: `backend/src/services/payment.service.js:45-76`; unchecked commit result: `backend/src/db/transaction.js:4-25`. This follows PostgreSQL aborted-transaction semantics; no confirmed isolated DB existed for fault injection.

### Result, impact and controls

Expected: success means durable payment/intake/audit state. Potential actual result: API/service success object with no committed state. Transaction grouping is positive but error suppression defeats its reporting semantics.

### Recommendation, acceptance, regression and cleanup

Propagate the audit failure or use a transactional outbox/savepoint with defined policy; verify commit outcome and optionally re-read. Fault-injection regression must assert error + rollback + no success object. No database was touched.

## DOS-001 — PDF work queue and Chromium jobs are unbounded

Severity: **Medium** · Priority: **P2** · Status: **CONFIRMED** · Confidence: **High**  
CVSS 4.0: preliminary 6.9 — `CVSS:4.0/AV:N/AC:L/AT:P/PR:L/UI:N/VC:N/VI:N/VA:H/SC:N/SI:N/SA:N` · CWE-400 · API4:2023 · ASVS V11  
Affected: PDF generation endpoints/workers; authenticated/privileged callers; API availability

### Описание, предусловия и attack scenario

An allowed caller submits more PDF jobs than one Chromium worker can drain, or a render hangs. Every job retains a queued promise and no hard timeout releases capacity, causing memory growth and service degradation.

### Evidence и безопасное воспроизведение

Unbounded `queue.push`: `backend/src/utils/asyncLimiter.js:1-27`; no queue/job/launch timeout: `backend/src/services/pdf.service.js:7-128`. Review only—load, hang and queue-exhaustion PoCs were prohibited.

### Result, impact and controls

Concurrency one limits simultaneous Chromium processes, while JS disable/network interception reduce renderer work. They do not cap waiting work or guarantee termination. Expected is bounded resource use and backpressure.

### Recommendation, acceptance, regression and cleanup

Cap queue, HTML/output sizes and per-user jobs; return 429, impose launch/render/close deadlines and isolate/recycle workers. A bounded regression should prove overflow rejection and deadline cleanup without stress. No jobs were launched.

## API-001 — Payment host allowlist fails open when configuration is empty

Severity: **Medium** · Priority: **P2** · Status: **CONFIRMED** · Confidence: **High**  
CVSS 4.0: N/A — requires privileged setter and user interaction · CWE-939/CWE-16 · API10:2023 · ASVS V13  
Affected: admin hosted-payment URL setter and user-visible payment link; billing trust

### Описание, предусловия и attack scenario

When production omits the allowlist, any HTTPS host passes. A compromised/misled admin can store a look-alike payment link that users trust as application-provided.

### Evidence и безопасное воспроизведение

Conditional allowlist: `backend/src/utils/hostedPaymentUrl.js:5-32`; empty default: `backend/src/config/env.js:109-128,183`. A string-only PoC accepted `https://attacker.example.invalid/pay` for `[]` and rejected it for a nonmatching list; no request was sent.

### Result, impact and controls

Actual: empty configuration means allow all HTTPS. Expected: production fails closed to provider-owned hosts. Admin role and HTTPS are useful but do not authenticate the destination; `AUTH-001` worsens the chain.

### Recommendation, acceptance, regression and cleanup

Require a non-empty normalized exact-host allowlist bound to provider type; define redirect policy. Startup and URL tests must reject absent list, userinfo, subdomain confusion and unlisted redirects. No DB/network cleanup.

## OPS-001 — Production TLS, backup/restore, retention schedule and monitoring are unverified

Severity: **Medium** · Priority: **P1** · Status: **NOT_VERIFIED** · Confidence: **Medium**  
CVSS 4.0: N/A · CWE-16 · OWASP Security Misconfiguration · ASVS V12/V14  
Affected: production edge, DB transport, backups, retention and security operations

### Описание, предусловия и attack scenario

Repository evidence is insufficient to authorize real PII: supplied deployment is HTTP, backup/restore facts are TODO, retention is not scheduled there, and alert routing/tamper resistance is absent. Production could have external compensating controls, so absence is not asserted.

### Evidence и безопасное воспроизведение

`docker-compose.yml:81-93`; `docs/security/backup-restore-runbook.md:11-30,57-59`; retention CLI/admin code but no Compose/Actions scheduler; no SIEM configuration. No production access, interception or restore test was authorized.

### Result, impact and controls

Actual status is unknown, not proven insecure. Expected release evidence: TLS/HSTS, DB CA validation, current backup and isolated restore drill, scheduled locked retention with metrics, and alert/on-call routing.

### Recommendation, acceptance, regression and cleanup

Treat the evidence bundle as a PII launch gate. Attach configuration screenshots/exports, restore-drill record, retention run metrics and alert test. No system was changed and no cleanup applies.

## CI-001 — Security pipeline is incomplete and DAST cannot block merge

Severity: **Medium** · Priority: **P2** · Status: **CONFIRMED** · Confidence: **High**  
CVSS 4.0: N/A · CWE-693 · NIST SSDF PW.4/RV.1 · OWASP Software/Data Integrity Failures  
Affected: pull-request security gates and build supply chain

### Описание, предусловия и attack scenario

A DAST-detectable regression can merge because the whole job is allowed to fail. Mutable third-party Action tags can change upstream; missing artifact/component gates reduce detection and provenance.

### Evidence и безопасное воспроизведение

`continue-on-error`: `.github/workflows/dast-baseline.yml:13-18`; mutable Actions: `.github/workflows/ci.yml:49-55`, `.github/workflows/codeql.yml:26-38`; no workflow for secret/container/IaC/SBOM/signing. Static config review only; no CI run was triggered.

### Result, impact and controls

Expected security-policy violations block merge with immutable dependencies. Actual DAST is informational. Minimal permissions, safe PR event, blocking High npm audit and CodeQL are meaningful compensating controls.

### Recommendation, acceptance, regression and cleanup

Tune then block on DAST policy; pin Actions/images by SHA/digest; add secret/container/IaC scans and CycloneDX/provenance/signing. Seeded policy failures must fail required checks. No workflow was modified or run.

## API-002 — Supplied frontend deployment lacks browser security headers and TLS redirect

Severity: **Medium** · Priority: **P2** · Status: **CONFIRMED** · Confidence: **High**  
CVSS 4.0: N/A — deployment misconfiguration · CWE-693/CWE-319 · OWASP Security Misconfiguration · ASVS V3/V12  
Affected: supplied Nginx frontend/reverse proxy; browsers; all web data

### Описание, предусловия и attack scenario

The supplied stack serves HTTP and the HTML document lacks CSP/frame/referrer/permissions/no-sniff policy. If exposed as supplied, a network attacker can target cleartext and another site can frame the UI; future injection has no CSP containment.

### Evidence и безопасное воспроизведение

`frontend/nginx.conf:1-12` and `deploy/nginx.conf:1-44` listen on 80 and set no listed headers/redirect. Backend Helmet protects API responses, not frontend HTML. A live proxy was not available; production edge remains unknown.

### Result, impact and controls

Actual supplied behavior lacks defense-in-depth; expected behavior is HTTPS at the terminating edge and browser policy on HTML/sensitive responses. Same-origin controls and backend Helmet only partially compensate.

### Recommendation, acceptance, regression and cleanup

Add HTTPS redirect/HSTS at the true edge, CSP `frame-ancestors`, no-sniff, Referrer/Permissions and PII cache policy. Integration tests through the deployment proxy must validate all headers and no direct backend exposure. No runtime changes were made.

## LOG-001 — Unsubscribe bearer token appears in logged URLs

Severity: **Medium** · Priority: **P2** · Status: **CONFIRMED** · Confidence: **High**  
CVSS 4.0: N/A · CWE-598/CWE-532 · OWASP Security Logging Failures · ASVS V7/V14  
Affected: unsubscribe URLs, browser history/referrer, Nginx/application logs; email preferences

### Описание, предусловия и attack scenario

A person/service with URL-log or browser-history access can obtain a still-valid bearer token and alter suppression state or learn link metadata. The token is intentionally in both frontend query and a legacy backend GET path.

### Evidence и безопасное воспроизведение

URL construction: `backend/src/constants/emailCompliance.js:82-91`; frontend query read: `frontend/src/pages/UnsubscribePage.jsx:5-8`; GET path: `backend/src/routes/public/unsubscribe.routes.js:9-12`; full URL serializer: `backend/src/middleware/httpLogger.js:12-18`. No real token was generated or printed.

### Result, impact and controls

Expected: bearer secrets never enter logs/history and are single-use. Actual design places them in request URLs. Signature verification prevents forgery but not replay by a reader.

### Recommendation, acceptance, regression and cleanup

Use one-time opaque exchange/fragment-to-POST, remove tokenized GET, redact every proxy/app layer and set strict referrer policy. Regression must inspect captured logs and replay behavior using only fingerprints. No token cleanup was needed.

## CONT-001 — Chromium runs without sandbox and without container resource isolation

Severity: **Medium** · Priority: **P2** · Status: **CONFIRMED** · Confidence: **High**  
CVSS 4.0: N/A — requires a separate renderer exploit · CWE-250/CWE-400 · OWASP Security Misconfiguration · API4:2023  
Affected: backend Chromium/PDF container; user-derived legal HTML; host/service boundary

### Описание, предусловия и attack scenario

If crafted renderer input reaches a Chromium vulnerability, disabled browser sandbox removes a major containment layer. A runaway process also lacks explicit CPU/RAM/PID isolation.

### Evidence и безопасное воспроизведение

Flags: `backend/src/services/pdf.service.js:13-23`; non-root container: `backend/Dockerfile:24-39`; JS/network blocking: `pdf.service.js:25-38`; Compose contains no listed resource/security options. No browser exploit or image run was attempted.

### Result, impact and controls

Actual sandbox is disabled. Expected is sandboxed, patched, least-privileged isolated rendering. Non-root, escaped templates and blocked JS/network reduce exploitability but do not replace renderer sandbox/resource boundaries.

### Recommendation, acceptance, regression and cleanup

Enable Chromium sandbox in a compatible isolated worker, drop capabilities, restrict filesystem/network and set CPU/RAM/PID/time limits. Runtime probe/tests must verify flags and termination. No process/data was created.

## CRYPTO-001 — JWT lacks issuer/audience binding

Severity: **Low** · Priority: **P3** · Status: **CONFIRMED** · Confidence: **High**  
CVSS 4.0: N/A — no cross-service acceptance demonstrated · CWE-345 · OWASP Authentication Failures · API2:2023 · ASVS V9  
Affected: access-token issuer/verifier; all authenticated roles

### Описание, предусловия и attack scenario

If another environment/service ever shares the signing key, a correctly signed access token has no issuer/audience boundary and may be accepted here. No current key-sharing path was established, so this is Low hardening.

### Evidence и безопасное воспроизведение

`backend/src/utils/auth.js:44-73` sets/verifies HS256, type, subject, `iat`, `jti`, expiration, but not `iss`/`aud`. Focused JWT tests passed current behavior. The local secret was fingerprinted only and was not found tracked/history.

### Result, impact and controls

Expected: service/environment-bound token. Actual: signature/type/user state bind the token, but issuer/audience do not. Algorithm pinning and active-user reload are strong compensating controls.

### Recommendation, acceptance, regression and cleanup

Introduce stable issuer/audience and verify both, with a controlled active-token rollout/rotation. Cross-service/environment tokens must fail tests while valid local tokens pass. No token was persisted.

## Revalidation note

Every Critical/High was rechecked for public input, authentication/authorization, validation, compensating controls, production call path and scanner-only assumptions. Results are recorded in `FALSE_POSITIVES.md`. No confirmed IDOR, SQL injection, SSRF, command injection or exploitable XSS was established; parameterized SQL, ownership policies, output escaping, blocked PDF networking and strict upload checks are material positive controls, not guarantees outside the executed scope.
