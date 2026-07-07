# Command Ledger

Audit window: 2026-07-06, approximately 15:19–15:55 Europe/Chisinau. Unless stated otherwise, working directory was `/home/arina/projects/Affordable-immigration-service`, commands were read-only, created no files and exited `0`. Commands containing credentials are represented with `REDACTED`; no secret value is reproduced. Several closely related `rg`/`sed`/`nl` reads executed in one shell cell are recorded as one batch while preserving every command category and target.

| # | Time | Команда | Цель | Exit code | Data/files changed | Ключевой результат / ограничения |
|---:|---|---|---|---:|---|---|
| 1 | 15:18 | `sed -n '1,260p' …/pasted-text.txt` | Read authorized audit request | 0 | No | Scope/safety/report requirements captured. |
| 2 | 15:18 | `sed -n '261,620p' …/pasted-text.txt` | Continue request | 0 | No | App/API requirements captured. |
| 3 | 15:18 | `sed -n '621,1040p' …/pasted-text.txt` | Continue request | 0 | No | Business/privacy/supply-chain requirements captured. |
| 4 | 15:18 | `sed -n '1041,1580p' …/pasted-text.txt` | Finish request | 0 | No | Dynamic/testing/output requirements captured. |
| 5 | 15:19 | `pwd` | Confirm scope root | 0 | No | Correct repository. |
| 6 | 15:19 | `git status --short` | Snapshot dirty tree | 0 | No | Pre-existing user modifications/untracked files present. |
| 7 | 15:19 | `git rev-parse HEAD` | Snapshot commit | 0 | No | `672b74e8d8418d9fc1cdff12d439936f35e38176`. |
| 8 | 15:19 | `git branch --show-current` | Snapshot branch | 0 | No | `main`. |
| 9 | 15:19 | `git diff --stat` | Quantify user changes | 0 | No | Dirty working tree retained untouched. |
| 10 | 15:19 | `git diff --name-only` | List modified paths | 0 | No | Baseline recorded before audit. |
| 11 | 15:19 | `rg --files -g '!node_modules' -g '!.git'` plus `find` depth-limited inventory | Repository architecture inventory | 0 | No | Node/Express/PostgreSQL/React/Nginx/Docker/Actions identified. |
| 12 | 15:19 | `node --version; npm --version; docker --version; docker compose version; psql --version` | Runtime/tool versions | 0 | No | Node 26.2.0, npm 11.13.0, Docker 29.6.1, Compose 5.1.4, psql 18.4. |
| 13 | 15:19 | `command -v semgrep codeql osv-scanner gitleaks trivy checkov hadolint syft grype zap-baseline cyclonedx` | Available security tools | Mixed/not found | No | All listed specialist tools unavailable. |
| 14 | 15:20 | `sed`/`nl` package manifests, route indexes and `app.js` | Map dependencies/endpoints/middleware | 0 | No | Public, account, admin, health/readiness surfaces mapped. |
| 15 | 15:20 | `sed`/`nl` all route files under `backend/src/routes` | Endpoint/access inventory | 0 | No | Attack surface and authorization matrix inputs collected. |
| 16 | 15:20 | `sed`/`nl` auth middleware/config/schemas/services/repositories | Authentication review | 0 | No | First-user-admin path and positive token controls found. |
| 17 | 15:20 | `sed`/`nl` email verification/reset/session flows | Recovery/session review | 0 | No | Stub/false-sent behavior and rotation/reuse controls identified. |
| 18 | 15:20 | `sed`/`nl` booking, Docketwise and intake flows | Critical business logic review | 0 | No | Booking no-op, false sync and field-loss paths found. |
| 19 | 15:20 | `sed`/`nl` schemas, migrations and frontend intake files | Trace frontend → schema → DB | 0 | No | Four case-review fields absent from backend contract/persistence. |
| 20 | 15:21 | `sed`/`nl` DSAR services/repositories/migrations/export/storage | Privacy deletion/export review | 0 | No | Incomplete anonymization and premature `completed` confirmed. |
| 21 | 15:21 | `sed`/`nl` access policies, ownership repositories and workflow services | Authorization/IDOR/state review | 0 | No | Material ownership/role checks found; no confirmed IDOR. |
| 22 | 15:21 | `sed`/`nl` PDF, limiter, upload, payment URL and file services | File/SSRF/resource review | 0 | No | Queue/no-sandbox/fail-open allowlist identified; upload defenses reviewed. |
| 23 | 15:21 | `sed`/`nl` Dockerfiles, Compose, Nginx, CI and security docs | Container/deployment/CI review | 0 | No | HTTP-only supplied config, mutable refs, warn-only DAST, ops evidence gaps. |
| 24 | 15:21 | `sed`/`nl` frontend sinks/storage/API/auth context | XSS/browser storage review | 0 | No | Intake PII in localStorage; auth access token is not there. |
| 25 | 15:21 | `sed`/`nl` logging, templates, URL builders and audit services | Leakage/audit review | 0 | No | URL token exposure and transaction audit risk identified. |
| 26 | 15:21 | `rg -n` for SQL construction, child process, fetch/URL, HTML sinks, serialization, idempotency, MFA and schedulers | Cross-cutting dangerous-pattern search | 0 | No | No reachable SSRF/shell/SQL injection found; gaps validated manually. |
| 27 | 15:21 | `rg -n` and `nl` all SQL migrations/repositories | DB constraints/transactions/tenancy | 0 | No | Parameterization and several constraints positive; replay/DSAR gaps remain. |
| 28 | 15:21 | `rg -n`/`sed` existing tests | Assess security assertions | 0 | No | Non-empty suite; one stale root validation test later reproduced. |
| 29 | 15:21 | `find . -maxdepth …` for `.env`, keys, dumps, backups, logs and archives | Secret/artifact inventory | 0 | No | Ignored root `.env` found; no suspicious tracked artifact by filename. |
| 30 | 15:22 | Initial shell fingerprint expression | Safe `.env` fingerprinting | 2 | No | Quoting error; no secret output retained in report. |
| 31 | 15:22 | Node fingerprint script over env files (values never printed) | Classify secrets safely | 0 | No | Names/location/short SHA-256 only; local `.env` ignored/untracked. |
| 32 | 15:22 | Node child-process tracked-tree secret scanner | Signature scan | non-zero (EPERM) | No | Sandbox blocked child process; fallback searches used. |
| 33 | 15:22 | `git ls-files` + `git grep -n -I -E <secret signatures>` | Tracked secret scan | 0 | No | No private key/cloud/GitHub/OpenAI token signature; examples/placeholders reviewed. |
| 34 | 15:22 | `git log --all -p -- . ':!package-lock.json'` piped to redacted signature matching | Git-history secret scan | 0 | No | No matching real secret found; no values recorded. |
| 35 | 15:22 | `git check-ignore -v .env; git ls-files .env` | Verify env tracking | 0 | No | `.env` is ignored and absent from index/history checks. |
| 36 | 15:23 | `npm audit --json` (root, sandbox network) | SCA | non-zero | No | DNS/network restriction. |
| 37 | 15:23–15:25 | Escalated `npm audit --json` attempt | Retry SCA with network authorization | terminated | No | Approval/execution did not complete; later bounded runs succeeded. |
| 38 | 15:26 | `timeout 60 npm audit --json` (root) | Root SCA | 0 | No | 0 vulnerabilities. |
| 39 | 15:26 | `timeout 60 npm audit --omit=dev --json` (root) | Root production SCA | 0 | No | 0 vulnerabilities. |
| 40 | 15:26 | `timeout 60 npm audit --json` in `backend` | Backend SCA | 1 (advisories) | No | 8 groups: 2 High, 6 Moderate. |
| 41 | 15:26 | `timeout 60 npm audit --omit=dev --json` in `backend` | Backend production SCA | 1 (advisories) | No | 7 groups: 2 High, 5 Moderate. |
| 42 | 15:26 | `timeout 60 npm audit --json` in `frontend` | Frontend SCA | 1 (advisories) | No | 7 groups: 4 High, 2 Moderate, 1 Low. |
| 43 | 15:26 | `timeout 60 npm audit --omit=dev --json` in `frontend` | Frontend production SCA | 1 (advisories) | No | 4 groups: 3 High, 1 Moderate. |
| 44 | 15:27 | `npm ls multer express body-parser qs express-rate-limit ip-address puppeteer-core ws brace-expansion --all` in backend | Exact installed versions/paths | 0 | No | Multer 2.1.1 and transitive versions confirmed. |
| 45 | 15:27 | `npm ls react-router react-router-dom vite @babel/core js-yaml puppeteer-core ws --all` in frontend | Exact installed versions/paths | 0 | No | React Router 7.13.2, Vite 8.0.10, ws 8.20.0 confirmed. |
| 46 | 15:27 | Node lockfile inspection for `integrity`, Git/HTTP deps and install scripts | Supply-chain integrity review | 0 | No | Integrity present; no Git/plain HTTP deps; optional `fsevents` script only. |
| 47 | 15:28–15:29 | Official web lookups: OWASP Top 10:2025, ASVS 5.0, API Top 10:2023, NIST SSDF, GitHub advisories, CISA KEV mirror | Current standards/CVE/KEV verification | 0 | No project data sent | CISA catalog 2026.07.01; listed npm CVEs not in KEV. |
| 48 | 15:29 | `docker compose config` | Resolve deployment configuration | 0 | No | Local services/ports/env defaults verified; output treated as sensitive and not reproduced. |
| 49 | 15:29 | `docker ps` / image inspection attempt | Determine local isolated stack/images | non-zero | No | Docker daemon unavailable. |
| 50 | 15:29–15:30 | Escalated Docker daemon inspection attempt | Retry daemon evidence | terminated | No | Approval/execution did not complete; stack not started. |
| 51 | 15:31 | `rg -n` for idempotency/unique constraints/state transitions | Replay/race review | 0 | No | No command idempotency contract; some unrelated uniqueness exists. |
| 52 | 15:31 | `rg -n` for external HTTP clients, SSRF sources, retention runners/schedulers | Integration/scheduler review | 0 | No | No provider call in Docketwise; retention runner exists without deployment schedule. |
| 53 | 15:31 | `npm test` (root) | Full root tests | 1 | No | 2/3 files; stale intake test failed. |
| 54 | 15:31 | `npm test` in backend | Full backend tests | 1 | No | 41/52 files; 11 API files unable to open listener under sandbox. |
| 55 | 15:31 | `npm test` in frontend | Full frontend tests | 0 | No | 12/12 files passed. |
| 56 | 15:32 | Backend API test retry with `DATABASE_URL=postgresql://REDACTED@127.0.0.1:1/nonexistent` | Prove target cannot be production | terminated | No | Escalated localhost listener request did not complete; no DB connection. |
| 57 | 15:32 | Focused backend service/security tests | Safe auth/authz/business verification | 0 | No | Group 7/7 passed. |
| 58 | 15:32 | Focused backend policy/JWT/cookie/payment/template tests | Safe control verification | 0 | No | Group 5/5 passed. |
| 59 | 15:33 | `node --test tests/intake.validation.test.js` | Reproduce root test issue | 1 | No | 2 pass/2 fail; fixture misses required consent field. |
| 60 | 15:33 | Inline Node schema PoC with synthetic `example.invalid` data | Mass assignment and field preservation | 0 | No | Role stripped; four case-review fields silently stripped. |
| 61 | 15:33 | Inline Node service PoC calling booking twice | Replay/persistence behavior | 0 | No | Two successes, no durable ID or writes. |
| 62 | 15:33 | Inline Node URL PoC against `attacker.example.invalid` string only | Payment allowlist behavior | 0 | No/network | Empty allowlist accepted; configured list rejected. |
| 63 | 15:35 | `node -e "import('cvss')…"` | Check local CVSS calculator | 1 | No | Package unavailable. |
| 64 | 15:35–15:36 | Escalated temporary `/tmp` npm install of CVSS package | Obtain calculator without touching repo | terminated | No repo change | Approval/execution did not complete; numeric scores marked preliminary/N/A. |
| 65 | 15:36 | `git status --short; git diff --stat; git diff --name-only` | Recheck source immutability | 0 | No | No audit-induced source changes. |
| 66 | 15:36 | `mkdir -p docs/security-audit` | Create permitted report directory | 0 | Directory only | Only authorized report path created. |
| 67 | 15:37–15:55 | `apply_patch` additions under `docs/security-audit/*.md` | Write audit reports | 0 | Report files only | No application/source/config file modified. |
| 68 | 15:54 | `ls -la docs/security-audit; wc -l docs/security-audit/*.md; sed …` | Report consistency/readback | 0 | No | Required drafts present and readable. |
| 69 | 15:55 | `sed`/`nl` targeted evidence recheck across auth, DSAR, intake, payment, PDF, Docker/Nginx/CI | Validate line citations and High/Critical paths | 0 | No | Evidence and compensating controls reconfirmed. |

## Not executed

The following are statuses, not hidden commands: Semgrep/CodeQL CLI/OSV/Gitleaks/Trivy/Checkov/Hadolint/Syft/Grype/ZAP were `NOT_EXECUTED_TOOL_UNAVAILABLE`; Docker image/history scan was `NOT_EXECUTED_ENVIRONMENT`; live HTTP/DB matrix was `NOT_EXECUTED_ENVIRONMENT`; DoS, deep multipart, queue exhaustion, Chromium exploit, production scan, real providers and destructive DSAR PoC were `NOT_EXECUTED_SAFETY`.

## Files created

Only the Markdown files listed in `SECURITY_AUDIT_2026-07.md` were created under `docs/security-audit/`. `sbom.cdx.json` was not created because no safe local generator was available and a truthful multi-project CycloneDX document was not produced.
