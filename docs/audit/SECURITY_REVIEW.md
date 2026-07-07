# Security review

## Verdict

Security posture: **FAIL для production**. Положительные controls есть, но SEC-001 допускает полный privilege escalation на пустой/неправильно provisioned БД. Дополнительно остаются high dependency advisory, incomplete DSAR deletion, отсутствие staff MFA, TLS/at-rest evidence и production provider controls.

## Подтверждённые controls

- Parameterized PostgreSQL queries; динамическое имя таблицы retention выбирается из hardcoded map.
- Zod request schemas, в основном strict для mutation payloads.
- JWT HS256 с algorithm/type check, 15-minute access token; access token хранится в памяти frontend.
- Opaque refresh tokens хранятся hash-ами, rotation/reuse detection, HttpOnly/Secure production cookie.
- RBAC middleware + service/domain checks; owner-level lead/document checks и IDOR tests.
- Helmet CSP/HSTS/referrer/permissions headers в production; CORS allowlist.
- Password hashing — salted `scrypt` + timing-safe comparison.
- Upload limit, server UUID name, basename/path check, MIME+magic-byte validation.
- Document templates HTML-escape user fields; frontend document sanitizer strips attributes/unknown tags; PDF JS/network disabled.
- Hosted payment URL требует HTTPS; card-like values блокируются/redact-ятся в payment notes.
- Structured audit metadata redaction; request ID/correlation fields.
- Backend Docker image работает как `node`, graceful shutdown и startup config validation.
- Live/API security header and IDOR tests прошли в полном backend suite.

Наличие этих controls не компенсирует findings ниже.

## Findings и attack scenarios

### SEC-001 — Critical — bootstrap admin takeover

**Attack scenario:** deployment запускается с пустой БД, `ADMIN_EMAIL`/`ADMIN_PASSWORD` не заданы или seed не создал пользователя. Первый Internet user вызывает register и получает `admin`. При race несколько первых users могут пройти `COUNT=0` до INSERT.

**Affected:** auth/RBAC, все `/api/admin/*`.

**Evidence:** `auth.service.js:getInitialRole/registerUser`; optional admin env; `seedInitialAdmin` early return; тест явно ожидает first-user admin.

**Impact:** чтение/изменение legal PII, DSAR exports, users/roles, payment links, documents, deletion.

**Fix:** public role hardcoded `user`; out-of-band invite/bootstrap; fail-safe provisioning.

**Verify:** empty-DB/concurrent registration tests; negative admin endpoint tests; production bootstrap runbook.

### SEC-002 — High — vulnerable dependency tree

**Attack scenario:** attacker посылает aborted/deeply nested multipart upload для Multer DoS; другие advisory затрагивают `ws`, React Router, rate-limit dependency and parsers. Применимость отдельных React Router server-mode issues к SPA требуется доказать, но package version попадает в affected range.

**Affected:** backend upload/runtime; frontend dependency tree/build tooling.

**Evidence:** online npm audit code 1: backend 7 (2 high), frontend prod 4 (3 high); Docker clean install подтверждает totals.

**Impact:** availability/memory disclosure и broken CI gate.

**Fix:** upgrade/override/remove unused dependencies; upload regression/load tests; document exploitability exceptions only with owner/expiry.

**Verify:** production audits code 0 and clean image scan.

### SEC-003 — High — immigration/billing draft PII in localStorage

**Attack scenario:** same-origin XSS, malicious extension или следующий пользователь shared device читает key `immigration-intake` после logout.

**Affected:** `frontend/src/context/IntakeContext.jsx`.

**Evidence:** весь context JSON сохраняется при каждом change; нет TTL/logout cleanup.

**Impact:** disclosure name/contact/case notes/billing/deadline.

**Fix:** memory/session draft, minimization, TTL and lifecycle cleanup; CSP remains defense-in-depth.

**Verify:** browser tests after logout/success/reload/TTL.

### SEC-004 — Medium — unrestricted HTTPS payment destinations by default

**Attack scenario:** mistaken/compromised admin sets look-alike HTTPS domain; clients see «Pay securely» link.

**Affected:** admin payment link, `PAYMENT_HOST_ALLOWLIST`.

**Evidence:** empty allowlist permits all hosts; production example omits variable.

**Impact:** phishing/payment diversion.

**Fix:** mandatory exact host/provider validation, punycode normalization, dual confirmation/audit.

**Verify:** startup and URL negative tests.

### SEC-005 — Medium — upload defense incomplete in production default

**Attack scenario:** authenticated admin account uploads polyglot/malware; scanner disabled, UUID URL becomes public and immutable-cached. Aborted/orphan uploads consume disk.

**Affected:** local upload storage/public image endpoint.

**Evidence:** scanner default false; no metadata/reference/expiry/quota; named volume.

**Impact:** malware/social content/storage DoS and difficult erasure.

**Fix:** fail-closed scanning policy, object storage quarantine/lifecycle, quotas and delete/reference model.

**Verify:** malware/abort/polyglot/quota/expiry tests.

### SEC-006 — High — sensitive data at-rest protection not verified

**Attack scenario:** host volume/snapshot/backup is copied. Most sensitive content is plaintext PostgreSQL; uploads plaintext; DSAR PDF encrypted only if optional key set.

**Affected:** DB/volumes/backups.

**Evidence:** Compose named volumes; optional key; security checklist TODO.

**Impact:** bulk PII/document disclosure.

**Fix:** encrypted managed storage/backups, key manager/rotation, mandatory production policy.

**Verify:** provider evidence + encrypted restore drill.

### SEC-007 — High — password-only staff access

**Attack scenario:** credential stuffing/phishing yields admin/attorney session; no MFA/step-up before bulk privacy exports or role changes.

**Affected:** staff identity and sensitive admin endpoints.

**Evidence:** only password/JWT flows found; no MFA/session inventory/recent-auth claims.

**Impact:** broad legal PII compromise.

**Fix:** staff MFA, step-up, revoke-all, anomaly alerts.

**Verify:** assurance-level API tests and lost-device playbook.

### Related high-risk data findings

- **DATA-001:** DSAR deletion does not erase intake/payment/document PII yet reports complete.
- **DATA-002:** audit service swallows SQL errors; when passed an active transaction client, a failed audit INSERT can abort/rollback the transaction while service returns an UPDATE result.
- **REL-001:** PDF starts Chromium with `--no-sandbox`, unbounded queue and no timeout/resources.
- **OPS-002:** supplied deployment edge is HTTP-only.

## Security area matrix

| Area | State | Evidence / limitation |
| --- | --- | --- |
| Authentication | PARTIAL | Strong token rotation/hash; dangerous bootstrap; verification delivery stub |
| Authorization | PARTIAL | Route/service policies and IDOR tests; SEC-001 bypasses provisioning; no tenant concept (single firm) |
| Session management | PARTIAL | Rotation/reuse/logout; no MFA, session list/revoke-all/step-up |
| Passwords | COMPLETE implementation | scrypt; schema min length; no breached-password/MFA controls |
| CORS | PARTIAL | Explicit origins and credentials; production correctness depends env |
| CSRF | LOW CURRENT RISK | Mutations require Bearer token; refresh cookie SameSite=Lax; no cookie-auth mutations beyond session lifecycle |
| XSS | PARTIAL | Escaping/sanitizer/CSP; sanitizer has no behavior test; localStorage raises impact |
| SQL injection | STRONG | Parameterized SQL; controlled dynamic table map |
| Command injection | PARTIAL | `execFile` scanner with fixed args; command path config-only; production scanner not enabled |
| SSRF | STRONG for PDF | JS disabled + request interception blocks external requests; provider integrations absent |
| Path traversal | STRONG | basename/regex/resolve prefix validation and tests |
| File upload | PARTIAL | MIME/magic/size/name good; malware/lifecycle/quota gaps |
| Object storage/signed URLs | NOT_IMPLEMENTED | Local public images; DSAR access through authenticated API |
| Secrets | PARTIAL | Env validation, `.env` ignored, no high-confidence secret prefix found in current tree; no installed CI/history scanner evidence |
| Audit logging | PARTIAL | Broad/redacted events; fail-open/gaps/no alert |
| PII in logs | PARTIAL | HTTP logger excludes body/query values but logs URL/user-agent/IP and errors; centralized redaction/retention not verified |
| Rate limiting | PARTIAL | General/auth in-memory limiter; no distributed/edge strategy, `trust proxy=1` topology-dependent |
| Container security | PARTIAL | Backend non-root; frontend default user; Chromium no-sandbox; no caps/read-only/resources/image scan |
| Dependency security | FAIL | Current online audits high and CI red |
| Encryption in transit | FAIL as supplied | HTTP-only edge |
| Encryption at rest | NOT_VERIFIED | Provider unknown, optional limited app encryption |

## Secrets review scope

Tracked current tree contains only example env files; common high-confidence AWS/GitHub/OpenAI/private-key prefix scan returned no filenames. Gitleaks/TruffleHog are not installed and history/remote GitHub secret-scanning state was not verified. Поэтому вывод — **активный секрет не найден в текущем tree**, а не «секретов никогда не было».

## Verification priorities

1. Empty DB privilege escalation regression.
2. Real PostgreSQL DSAR deletion inventory/fault tests.
3. Online dependency + image scan after upgrades.
4. Staff MFA/step-up E2E.
5. TLS/secure cookies/CORS/trusted proxy test in staging topology.
6. Upload abort/deep fields/malware/storage pressure tests.
7. Audit transaction fault injection.
8. Browser XSS/localStorage lifecycle tests.
