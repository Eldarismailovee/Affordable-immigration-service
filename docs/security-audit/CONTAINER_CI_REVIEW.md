# Container, Nginx, CI/CD and Operations Review

## Containers

Positive controls: backend multi-stage-ish dependency/runtime split, `npm ci --omit=dev`, `USER node`, `dumb-init`, healthcheck, internal DB network, no Docker socket/privileged/host network in Compose, public DB port absent.

Gaps:

- `node:26-bookworm-slim`, `postgres:16-alpine`, `nginx:stable-alpine` and Actions tags are not digest/SHA pinned.
- Chromium launches with `--no-sandbox`/`--disable-setuid-sandbox` while rendering stored, user-derived legal content.
- PDF queue has concurrency 1 but unbounded length and no launch/navigation/job timeout or per-user quota.
- Compose has no CPU/RAM/PID limits, read-only filesystem, tmpfs, cap drop, seccomp/AppArmor declaration.
- DSAR document encryption is optional; Compose defaults the key to empty.
- DB TLS defaults false in Compose. Production DB transport is unknown.
- Docker daemon/image inspection and Trivy image scan were not possible; image package CVEs are `NOT_VERIFIED`.

## Nginx / deployment

The supplied deployment listens on port 80 only and has no HTTPS redirect/HSTS. Backend Helmet protects API responses in production, but the HTML document is served by frontend Nginx, which sets no CSP, `frame-ancestors`/X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP/CORP or explicit no-sniff headers. Default access logs record full request paths.

`client_max_body_size 10M` is larger than the application image limit and is acceptable as an outer bound. Proxy connect/read/send timeouts are not explicit. Host is passed through. Backend `trust proxy=1` is safe only if exactly one trusted proxy and no direct backend exposure are guaranteed.

Production TLS/load balancer controls are `NOT_VERIFIED`; the report does not infer production TLS absence solely from local Compose.

## CI/CD

| Control | Result |
|---|---|
| Minimal token permissions | Present |
| Fork-safe event | `pull_request`; no `pull_request_target` |
| Tests/lint/build | Present |
| npm audit High gate | Blocking |
| CodeQL | Present |
| DAST | Present but entire job `continue-on-error: true` |
| Secret scanning | Documentation only; no workflow |
| Container/IaC scan | Absent |
| SBOM/provenance/signing | Absent |
| Action pinning | Mutable `@v3`, `@v4`, `@v0.14.0` |
| Deploy approvals/rollback | No deploy workflow in scope |

## Logging and monitoring

Structured application logs, request IDs and security audit tables exist. Audit metadata has redaction helpers. However:

- no SIEM/alert routing, brute-force/privilege-change alert, on-call ownership or tamper-resistant sink is configured;
- `httpLogger` records full URL; unsubscribe token path leaks into logs;
- infrastructure/access log retention and redaction are not configured;
- `recordAuditEvent()` suppresses database errors, including inside transactions (DB-001);
- admin HTTP audit is best-effort after response finish and is not a durable authorization gate.

## Backup / readiness

The backup document is a template, not evidence of snapshots or a successful restore. RPO/RTO and provider are TODO. `GET /api/ready` checks DB/migrations but no provider, volume writeability, Chromium or queue health.
