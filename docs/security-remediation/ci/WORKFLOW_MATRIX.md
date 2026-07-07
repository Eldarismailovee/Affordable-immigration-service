# CI Workflow Matrix

| Workflow | Trigger | Trust | Secrets | Blocking | Назначение |
| -------- | ------- | ----- | ------- | -------- | ---------- |
| CI | PR, push/main, merge_group | Untrusted PR / trusted main | CI-only env | **Yes** (`ci-required`) | Tests, audit, SAST, migrations, Docker |
| Security Scheduled | cron Mon 06:00 UTC | Trusted | CI-only | No | SBOM, informational DAST, full audit |
| Release Readiness | workflow_dispatch | Trusted | CI-only | No | Manual pre-release checklist |

## PR blocking jobs

workflow-security, secrets, backend, frontend, migrations, dependency-review, codeql, docker-build → **ci-required**

## Main additional jobs

postgres-integration, migration upgrade, compose-smoke, container-scan
