# Security Audit — July 2026

Audit date: **2026-07-06**  
Repository: **Affordable Immigration Service**  
Verdict: **FAIL**  
Commit reviewed: `672b74e8d8418d9fc1cdff12d439936f35e38176` on `main` with a pre-existing dirty working tree.

## 1. Executive summary

The application is not ready for staging with real PII or for production. A public user can become administrator when registering against an empty user table (`AUTH-001`, Critical). DSAR deletion can report completion while broad PII remains (`PRIV-001`, High). Legal case-review fields are silently dropped (`BUS-001`, High), Docketwise can be marked synced without provider delivery (`BUS-002`, High), and the reachable admin upload path uses vulnerable Multer 2.1.1 (`DEP-001`, High). Staff/admin authentication has no MFA (`AUTH-002`, High).

| Severity | Count |
|---|---:|
| Critical | 1 |
| High | 5 |
| Medium | 14 |
| Low | 1 |

| Status | Count |
|---|---:|
| CONFIRMED | 16 |
| HIGH_CONFIDENCE | 4 |
| SUSPECTED | 0 |
| FALSE_POSITIVE | 0 |
| NOT_VERIFIED | 1 |

Eight dependency hypotheses were separately classified `NOT_REACHABLE`, `MITIGATED` or dev-only and are not counted as severity findings. The concise launch decision is in [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md); full issue records are in [FINDINGS.md](./FINDINGS.md).

## 2. Scope

In scope: repository source and tests, public/authenticated/admin API, React frontend and browser storage, PostgreSQL schema/repositories, authentication/authorization, uploads/downloads/PDF, privacy/DSAR, payment and external-integration abstractions, Docker/Compose/Nginx, GitHub Actions, dependencies/lockfiles, logging/operations documentation and safe local unit/service PoCs.

## 3. Out of scope

No production/staging host, external IP, third-party provider, real email/SMS/payment, paid API, real PII, social engineering, destructive erasure, malware, stress/DoS or sandbox-escape exploit was used. Cloud/load-balancer, registry, running image layers, database grants, backups and monitoring outside the repository were not available.

## 4. Authorization and safety restrictions

Testing stayed inside the supplied repository and local process boundary. No external application target was scanned. Synthetic identities used `example.invalid`; URL validation PoCs parsed strings without network requests. The Docker stack was not started because daemon access and provenance of any existing volume could not be established. Dangerous CVE/queue/renderer PoCs were intentionally not performed. Source code and user data were not changed; only this report directory was written.

## 5. Repository snapshot

- CWD: `/home/arina/projects/Affordable-immigration-service`
- Branch: `main`
- Commit: `672b74e8d8418d9fc1cdff12d439936f35e38176`
- Initial state: dirty — 44 tracked files modified plus pre-existing untracked frontend/docs files.
- Audit handling: all pre-existing changes preserved; no checkout/reset/fix/update was run.
- Runtime: Node 26.2.0, npm 11.13.0, Docker 29.6.1, Compose 5.1.4, psql 18.4.
- Datastore: PostgreSQL 16 image/config; no confirmed isolated running DB.

The complete redacted execution record is [COMMAND_LEDGER.md](./COMMAND_LEDGER.md).

## 6. Architecture summary

React/Vite is served by frontend Nginx behind a reverse Nginx proxy. Browser calls Express API; Express uses PostgreSQL and local volumes for uploads/DSAR exports and launches local Chromium for PDF. Auth uses short-lived HS256 JWT access tokens plus rotating opaque refresh tokens in an HttpOnly cookie. Provider-facing email, booking and Docketwise paths are currently stubs/local state changes rather than durable provider integrations.

## 7. Threat model

Primary assets are admin/staff/user accounts, JWT/refresh/reset tokens, immigration/legal PII, uploads/generated documents, payments, DSAR records, audit logs, database and CI credentials. Threat actors include anonymous/ordinary users, cross-object attackers, former/compromised staff, malicious uploaders, log readers and supply-chain actors. Browser→proxy→API→DB/filesystem/Chromium/provider and CI→registry boundaries are analyzed, including compromise impact, in [THREAT_MODEL.md](./THREAT_MODEL.md).

## 8. Attack surface

Public site/API, auth/reset/verification/unsubscribe, account intake/booking/documents/DSAR, admin lead/document/payment/DSAR/retention/settings/upload, PDF generation, local storage, DB, volumes, health/readiness, ports and CI are inventoried in [ATTACK_SURFACE.md](./ATTACK_SURFACE.md). No inbound webhook implementation was found. A Mermaid trust-boundary diagram is included there and in the threat model.

## 9. Methodology

The audit combined repository/runtime inventory, route-to-service-to-repository data-flow tracing, manual source review, authz/ownership and state-machine analysis, schema differential PoCs, dependency SCA plus manual reachability, secret fingerprint/history searches, configuration review and safe focused tests. Every Critical/High was rechecked for untrusted input, reachability, authentication, authorization, validation, compensating controls and scanner-only assumptions.

## 10. Standards

The review used [OWASP Top 10:2025](https://owasp.org/Top10/2025/), [OWASP ASVS 5.0](https://owasp.org/www-project-application-security-verification-standard/), [OWASP API Security Top 10:2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/), [WSTG 4.2](https://owasp.org/www-project-web-security-testing-guide/v42/), [OWASP SCVS](https://owasp.org/www-project-software-component-verification-standard/), [NIST SP 800-218 SSDF 1.1](https://csrc.nist.gov/pubs/sp/800/218/final), CWE, [FIRST CVSS 4.0](https://www.first.org/cvss/v4.0/), [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) and CycloneDX principles. CVSS is not used as a replacement for business severity; business/control issues are marked N/A rather than assigned fabricated precision.

## 11. Tools and versions

Used: Git, `rg`, `sed`, `nl`, Node 26.2.0, npm 11.13.0, npm audit/advisory service, installed package trees, Docker Compose config parser and focused project tests. Official standards, GitHub advisories and the official CISA KEV data mirror were consulted.

Unavailable: Semgrep, CodeQL CLI, OSV-Scanner, Gitleaks, Trivy, Checkov, Hadolint, Syft, Grype, ZAP CLI and CycloneDX generator (`NOT_EXECUTED_TOOL_UNAVAILABLE`). CodeQL and ZAP do exist in CI configuration but were not locally executed. The Docker daemon/image was unavailable. A temporary CVSS calculator installation did not complete; preliminary scores are labeled.

## 12. Confirmed vulnerabilities

Sixteen findings are `CONFIRMED`: `AUTH-001`, `PRIV-001`, `BUS-001`, `BUS-002`, `AUTH-003`, `BUS-003`, `BUS-004`, `BUS-005`, `DATA-001`, `DOS-001`, `API-001`, `CI-001`, `API-002`, `LOG-001`, `CONT-001`, `CRYPTO-001`. Evidence, attack scenarios, controls, recommendations and tests are in [FINDINGS.md](./FINDINGS.md).

## 13. High-confidence findings

Four are `HIGH_CONFIDENCE`: `AUTH-002` (no privileged MFA), `DEP-001` (reachable Multer advisories; destructive PoC omitted), `DATA-002` (plaintext export path when key absent) and `DB-001` (suppressed audit SQL error/aborted transaction semantics). Their call paths are complete, but a live takeover, CVE/DoS payload, production file inspection or isolated PostgreSQL rollback PoC was intentionally/unavoidably not performed.

## 14. Suspected findings

None remain classified `SUSPECTED`. Environment-dependent operational questions were downgraded from assertions to one `NOT_VERIFIED` finding (`OPS-001`). Scanner-only package reports without reachable application paths were not promoted.

## 15. Dependency vulnerabilities

Root audit: zero. Backend: 8 advisory groups (2 High/6 Moderate), 7 in production scope (2 High/5 Moderate). Frontend: 7 groups (4 High/2 Moderate/1 Low), 4 in production-labelled scope (3 High/1 Moderate).

Manual review established:

- `multer@2.1.1`: CVE-2026-5079 and CVE-2026-5038 reach the multipart/disk upload implementation; fixed 2.2.0; admin required but chainable with `AUTH-001`.
- `ws@8.20.0`: transitive Puppeteer client to local Chromium; no inbound WebSocket server path (`NOT_REACHABLE`).
- React Router 7.13.2 advisories: SPA uses BrowserRouter without affected server handlers (`NOT_REACHABLE`).
- Vite, `qs`, `ip-address`, Babel/YAML and dev glob advisories: affected function/environment not reached.

No reviewed npm CVE matched CISA KEV catalog version 2026.07.01. Chromium's concrete image version, including exposure to Chromium KEV CVE-2026-11645, is `NOT_VERIFIED` because no image inspection was possible. Details and advisory links: [DEPENDENCY_AUDIT.md](./DEPENDENCY_AUDIT.md).

A truthful multi-project SBOM was not generated because no safe local generator was available; therefore `sbom.cdx.json` was intentionally not created.

## 16. Secrets review

No AWS/private-key/GitHub/OpenAI-like production secret signature was found in the checked tracked tree or history. The local `.env` is ignored and untracked. Values were never printed; safe inventory only:

| Type | Location | Fingerprint | Git history | Action |
|---|---|---|---|---|
| PostgreSQL password | `.env:3` | `sha256:e2186dbdb1bb…` | Not found | Placeholder/example; do not reuse. |
| Database URL | `.env:8` | `sha256:53ec2ab8b9e4…` | Not found | Local only; rotate if shared/reused or provenance unknown. |
| JWT signing secret | `.env:12` | `sha256:b0cbc30dc18e…` | Not found | Local only; rotate before any shared environment. |
| Admin email | `.env:13` | `sha256:258d8dc916db…` | Not found | Placeholder/example. |
| Admin password | `.env:14` | `sha256:ebe1b7da5ae2…` | Not found | Placeholder/example; must never be production credential. |

Docker layers and remote CI secret stores were not inspectable. One automated child-process scanner was blocked by the sandbox; independent Git/regex/history checks were used as fallback. “No exposed secret found” is limited to those checks, not a guarantee about external systems.

## 17. Authentication

Positive controls: scrypt with random salt/timing-safe compare, 48-byte opaque tokens stored hashed, short access TTL, algorithm/type pinning, refresh rotation and family revocation on reuse, active-user reload, HttpOnly refresh cookie, generic reset-request response, expiry/single-use token repository semantics and IP throttling.

Findings: public first-user admin (`AUTH-001`), no privileged MFA (`AUTH-002`), email verification not enforced and weak eight-character/IP-only credential policy (`AUTH-003`), false email delivery (`BUS-004`) and missing JWT issuer/audience (`CRYPTO-001`). Direct top-level/nested `role:admin` was stripped by registration Zod, so mass assignment by that payload is mitigated; alternate content types are constrained by JSON parsing, but duplicate-key HTTP behavior was not dynamically tested.

## 18. Authorization

Admin routes combine authentication with server-side role policies; owner-bound lead/document/DSAR access is enforced in service/repository paths. Frontend guards were not credited. No confirmed BOLA/IDOR was found in reviewed paths or focused ownership policy tests. The full anonymous/owner/foreign/staff/admin/blocked/deleted/stale-token HTTP matrix could not run without an isolated listener/database, so production authorization assurance remains incomplete. Matrix: [AUTHORIZATION_MATRIX.md](./AUTHORIZATION_MATRIX.md).

## 19. API security

Body size (1 MB), global/auth rate limits, Zod schemas, role/ownership services and pagination caps provide useful controls. Main API risks are public bootstrap escalation, resource consumption, fail-open payment URL allowlist, missing idempotency, false business-success states and incomplete inventory/versioning. No server-side request to a user-selected URL was found; payment URL is stored/rendered, not fetched. Malformed JSON, duplicate keys, unsupported media types, proxy headers and CORS/preflight were not verified through a running proxy.

## 20. Input validation

SQL calls reviewed are parameterized; dynamic retention identifiers are allowlisted. No confirmed SQL/NoSQL/command/template/LDAP injection, traversal, SSRF, unsafe deserialization, prototype pollution or exploitable XSS was established. HTML template values are escaped and PDF disables JavaScript/network requests. The important counterexample is validation **integrity**: Zod silently strips legitimate case fields (`BUS-001`). Schema presence alone was not treated as proof. MIME/extension/magic-byte checks are strong, while Multer parser vulnerabilities remain below them.

## 21. Frontend security

`dangerouslySetInnerHTML`/DOM sink paths reviewed did not yield a confirmed XSS. Access token is memory-only and refresh cookie HttpOnly. Full intake/legal/billing data is nevertheless persisted origin-wide in localStorage without expiry/logout cleanup (`DATA-001`). Supplied HTML Nginx responses lack a browser-header policy (`API-002`). Source-map publication and final production bundle/environment were not verified. Google Fonts/contact to a third party before consent was noted as a privacy deployment consideration, not promoted without production evidence.

## 22. File security

Uploads are admin-only and apply extension/MIME/magic-byte/size, randomized filename, traversal and download authorization controls; malware scanning is optional. Multer 2.1.1 parser/abort issues remain (`DEP-001`). DSAR export encryption is optional (`DATA-002`). Chromium receives escaped/stored legal HTML with JS and network disabled, but runs no-sandbox and lacks job/resource isolation (`CONT-001`, `DOS-001`). Foreign/deleted file-ID HTTP tests and safe mismatch/cleanup uploads were not run without an isolated stack.

## 23. Database security

Positive controls include parameterized queries, foreign/check/selected unique constraints, transaction wrappers, private internal DB network in Compose, pool bounds and migration locks. Gaps: no command-level idempotency, uncertain concurrent state locking, optional/non-production DB TLS defaults in supplied Compose, unverified role/schema grants/backups and `DB-001`'s swallowed audit error inside a transaction. A service returning a pre-rollback `RETURNING` row is plausible under PostgreSQL semantics and requires a dedicated regression on an isolated DB.

## 24. Privacy and PII

The system processes identity/contact, immigration matter/deadline, booking, billing/payment, conflict, agreement/onboarding, DSAR, auth metadata and IP/user-agent data across DB, volumes, browser and logs. DSAR deletion violates its completed post-condition (`PRIV-001`); export-at-rest encryption is optional and browser persistence is excessive. Retention code exists but is not deployment-scheduled. The complete inventory, locations and deletion coverage are in [PRIVACY_REVIEW.md](./PRIVACY_REVIEW.md).

## 25. Containers

Backend uses `USER node`, `dumb-init`, a healthcheck, production-only npm install and internal DB networking; no Docker socket, privileged mode, host network or public DB port is configured. Gaps include floating image/package versions, no digest pinning, Chromium no-sandbox, writable filesystems, no cap drop/read-only/tmpfs/seccomp/AppArmor declarations and no CPU/RAM/PID limits. Image packages/layers/CVEs were not inspectable. See [CONTAINER_CI_REVIEW.md](./CONTAINER_CI_REVIEW.md).

## 26. CI/CD

Minimal permissions, safe `pull_request` event, tests/build, blocking High npm audit and CodeQL are positive. DAST is non-blocking through job-level `continue-on-error`, Actions use mutable tags, and secret/container/IaC scanning, SBOM, signing and provenance gates are absent (`CI-001`). No deploy workflow was in scope, so environment approvals, credentials, rollback and production protection are unknown.

## 27. Logging and monitoring

Structured Pino logs, request IDs, auth/security event types, audit tables and metadata redaction exist. Risks: unsubscribe token in URLs/access logs (`LOG-001`), best-effort swallowed audit errors (`DB-001`), and no repository evidence for SIEM/alerts, brute-force/privilege/export anomalies, on-call routing, retention or tamper-resistant storage (`OPS-001`). Admin after-response audit is useful telemetry, not a durable authorization control.

## 28. Availability

Body/upload/pagination/rate/pool bounds exist. The PDF limiter restricts concurrency but has an unbounded promise queue and no hard job timeouts (`DOS-001`). Multer advisories add multipart resource risk. External provider timeout/retry behavior is largely absent because integrations are stubs. No stress, deep nesting, aborted upload accumulation or queue exhaustion was performed; conclusions come from code/data-flow inspection and bounded tests.

## 29. False positives

Scanner/version presence alone was not promoted. React Router server RCE/manifest/single-fetch, `ws` inbound server issues, Vite Windows dev path, `qs.stringify`, `ip-address` HTML helpers, Babel/YAML build-only paths and dev `brace-expansion` were judged not reachable in the deployed call paths reviewed. Direct role mass assignment is mitigated even though implicit bootstrap escalation is real. Full dispositions: [FALSE_POSITIVES.md](./FALSE_POSITIVES.md).

## 30. Previous findings revalidation

All 20 required hypotheses were rechecked. Concise outcomes:

1. first public admin — `CONFIRMED`;
2. privileged registration — implicit path `CONFIRMED`, supplied-role path `FALSE_POSITIVE/MITIGATED`;
3–4. complete DSAR deletion/completed post-condition — `CONFIRMED` broken;
5–6. case fields/Zod strip — `CONFIRMED`;
7–9. email/Docketwise/booking false success — `CONFIRMED`;
10. High dependencies — `CONFIRMED`, no Critical;
11. vulnerable dependency reachability — `PARTIALLY_FIXED`: Multer reachable, others not;
12. empty/false tests — `FALSE_POSITIVE` as a blanket claim; suite exists, one stale test and coverage gaps remain;
13. TLS/MFA/backup/scheduler/monitoring — `PARTIALLY_FIXED/NOT_VERIFIED`;
14. audit rollback success — `HIGH_CONFIDENCE`;
15–16. PDF queue/no-sandbox — `CONFIRMED`;
17. localStorage — PII `CONFIRMED`, auth-token hypothesis `FALSE_POSITIVE`;
18–19. payment allowlist/idempotency — `CONFIRMED`;
20. duplicate effects/transitions — duplicate creation `CONFIRMED`; all transition races `NOT_VERIFIED`.

Evidence-by-item is in [FALSE_POSITIVES.md](./FALSE_POSITIVES.md).

## 31. Production readiness

| Question | Decision |
|---|---|
| Safe to run locally? | Only isolated, with synthetic data and no untrusted network exposure. |
| Safe with test data? | Yes, with isolated local DB and disabled real providers. |
| Safe with real PII? | **No.** |
| Ready for staging? | **No**, not with real data. |
| Ready for production? | **No.** |
| Confirmed privilege escalation? | **Yes — first public user becomes admin.** |
| Confirmed IDOR? | No confirmed IDOR; HTTP matrix incomplete. |
| Exposed secrets? | None found in checked tracked tree/history; ignored local secrets exist. |
| CISA KEV/reachable Critical or High CVE? | Reachable High Multer CVEs; no match in reviewed KEV. Chromium KEV exposure unverified. |
| Complete DSAR deletion? | **No.** |
| Staff/admin protected? | Password/session controls exist; **no MFA**. |
| Backup/restore? | Runbook only; snapshots/drill unverified. |
| TLS? | Local supplied config HTTP; production TLS unverified. |
| Security monitoring? | Audit logs exist; alerting/SIEM/tamper resistance unverified. |

## 32. Remediation roadmap

P0: remove implicit public bootstrap admin and audit existing admin provenance. P1: complete/verifiable DSAR erasure, repair intake contract and Docketwise state, deploy privileged MFA/verified-email gates, upgrade/harden Multer, and prove TLS/backups. P2: idempotency, honest email/booking state, mandatory payment allowlist/export encryption, DB audit semantics, bounded isolated PDF, browser/header/logging hardening, retention scheduling and blocking supply-chain gates. P3/P4 add JWT/environment binding, state locks, container/API hardening, continuous threat modeling, signed provenance, SIEM and recovery exercises. Full owner/order/test/rollout gates: [REMEDIATION_PLAN_P0_P4.md](./REMEDIATION_PLAN_P0_P4.md).

The first remediation task is unambiguous: public registration must always create `user`; initial admin creation must move to a one-time, non-public, transactional bootstrap process.

## 33. Limitations

- No isolated PostgreSQL/HTTP stack: full authorization, proxy/CORS/header, upload/download and transaction PoCs were not run.
- Sandbox blocked test listeners; 11 backend API files failed to start for that reason. Full backend result was 41/52 files; frontend 12/12 passed; root had one stale intake fixture.
- No Docker daemon/image, production deployment, cloud, backups, registry or SIEM evidence.
- Specialist SAST/secret/container/IaC/SBOM/DAST tools were unavailable locally.
- npm SCA was current to audit time, but advisory/KEV data changes after 2026-07-06.
- No DoS, CVE exploit, destructive DSAR test or external provider request by safety policy.
- CVSS technical scores marked preliminary were not independently calculator-verified.

Executed PoCs, exact outcomes and reasons for every omitted dynamic check are documented in [DYNAMIC_TESTS.md](./DYNAMIC_TESTS.md).

## 34. Final verdict

**FAIL.** A confirmed unauthenticated path to admin is a P0 release blocker. Even after that is closed, incomplete DSAR deletion, silent legal-data loss, false integration states, lack of privileged MFA and reachable High Multer vulnerabilities block staging with real PII. Passing tests, lint or build cannot override these evidence-backed application and operational risks.

## Report set

- [SECURITY_AUDIT_2026-07.md](./SECURITY_AUDIT_2026-07.md)
- [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)
- [THREAT_MODEL.md](./THREAT_MODEL.md)
- [ATTACK_SURFACE.md](./ATTACK_SURFACE.md)
- [FINDINGS.md](./FINDINGS.md)
- [AUTHORIZATION_MATRIX.md](./AUTHORIZATION_MATRIX.md)
- [DEPENDENCY_AUDIT.md](./DEPENDENCY_AUDIT.md)
- [PRIVACY_REVIEW.md](./PRIVACY_REVIEW.md)
- [CONTAINER_CI_REVIEW.md](./CONTAINER_CI_REVIEW.md)
- [DYNAMIC_TESTS.md](./DYNAMIC_TESTS.md)
- [FALSE_POSITIVES.md](./FALSE_POSITIVES.md)
- [COMMAND_LEDGER.md](./COMMAND_LEDGER.md)
- [REMEDIATION_PLAN_P0_P4.md](./REMEDIATION_PLAN_P0_P4.md)

`sbom.cdx.json` is absent by design because no SBOM was actually generated.
