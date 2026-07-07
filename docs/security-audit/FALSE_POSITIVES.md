# False Positives and Revalidated Hypotheses

## Dependency/scanner triage

| Hypothesis | Status | Reason |
|---|---|---|
| React Router unauth RCE | NOT_REACHABLE | SPA has no server/turbo-stream deserializer |
| React Router `__manifest` / single-fetch DoS | NOT_REACHABLE | no framework server endpoints |
| Vite Windows path bypass | NOT_REACHABLE | Linux build; dev server not production runtime |
| `ws` internet-facing DoS/disclosure | NOT_REACHABLE | only local Puppeteer DevTools client path |
| `qs.stringify` DoS | NOT_REACHABLE | application/Express path uses parsing; vulnerable stringify options absent |
| `ip-address` XSS | NOT_REACHABLE | HTML-emitting methods absent |
| `brace-expansion` range DoS | NOT_REACHABLE | dev-only nodemon path, no untrusted glob input |
| Babel/js-yaml build advisories | NOT_REACHABLE | no untrusted source-map/YAML processing in production |
| Direct registration `{role:'admin'}` | MITIGATED | Zod strips role; server does not map it |
| JWT algorithm confusion | MITIGATED | verification pins HS256 and JWT typ |
| Auth token in localStorage | FALSE_POSITIVE | access token is module memory; refresh is HttpOnly cookie |
| SQL injection from repository interpolation | MITIGATED | parameters used; dynamic table selected from fixed map |
| Stored document XSS | MITIGATED | templates escape inputs and frontend allowlist sanitizer removes attributes |
| Server-side SSRF | NOT_REACHABLE | no backend HTTP client/provider request found |
| Confirmed cross-user IDOR | FALSE_POSITIVE | owner policy and focused tests deny foreign lead/DSAR access |

## Critical/High verification checklist

| Finding | Untrusted/relevant input | Sink | Auth/authz | Validation/control | Production reachability | Result |
|---|---|---|---|---|---|---|
| AUTH-001 | public registration timing | `createUser(role)` | none | payload role stripping irrelevant | route mounted | CONFIRMED |
| PRIV-001 | admin deletion action / PII corpus | only user+lead anonymizers, then completed | admin required | identity/legal hold, no post-condition | mounted | CONFIRMED |
| BUS-001 | case review answers | Zod parsed body → DB | user required | unknown keys stripped | active intake UI/route | CONFIRMED |
| BUS-002 | admin sync action | DB status `synced` | admin | no provider response/control | mounted | CONFIRMED |
| AUTH-002 | compromised staff credential | all privileged APIs | role only | no MFA code | no external IdP in scope | HIGH_CONFIDENCE |
| DEP-001 | multipart field names/abort | Multer parser/diskStorage | admin | 5 MiB file limit; no nesting/fields limit | mounted; chainable with AUTH-001 | HIGH_CONFIDENCE |

No Critical/High finding is based solely on a package name, TODO, comment or scanner result.

## Previous 20-point revalidation

| # | Hypothesis | Result |
|---:|---|---|
| 1 | First public user gets admin | CONFIRMED |
| 2 | Public registration can assign privileged role | CONFIRMED via implicit bootstrap; direct payload is MITIGATED |
| 3 | DSAR removes all PII | CONFIRMED false / REGRESSION remains |
| 4 | DSAR can complete with PII remaining | CONFIRMED |
| 5 | Relationship/location/deadline saved | CONFIRMED false |
| 6 | Zod silently strips | CONFIRMED |
| 7 | Email/reset false `sent` | CONFIRMED |
| 8 | Docketwise false `synced` | CONFIRMED |
| 9 | Booking success without save | CONFIRMED |
| 10 | High/critical dependencies | CONFIRMED: High present, no Critical from npm |
| 11 | Vulnerable runtime code reachable | PARTIALLY_FIXED: Multer yes; React Router/ws paths no |
| 12 | Empty/false security tests | FALSE_POSITIVE for empty tests; coverage gaps and stale failing test remain |
| 13 | TLS/MFA/backup/scheduler/monitoring | PARTIALLY_FIXED: logs/runner exist; MFA/scheduler/verified backup/monitoring absent; prod TLS unknown |
| 14 | Audit error can yield rollback with success object | HIGH_CONFIDENCE |
| 15 | PDF queue unbounded | CONFIRMED |
| 16 | Chromium `--no-sandbox` | CONFIRMED |
| 17 | PII/security tokens in localStorage | PARTIALLY_FIXED: PII yes, auth tokens no |
| 18 | Payment host allowlist default allow | CONFIRMED |
| 19 | Idempotency intake/payment/booking/privacy | CONFIRMED absent |
| 20 | Replay duplicates/repeated transitions | PARTIALLY_FIXED: intake/privacy duplicates; lead transition policy rejects repeats |
