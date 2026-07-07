# Fork PR Security

## Model

| Workflow | Fork PR | Same-repo PR |
| -------- | ------- | ------------ |
| ci.yml untrusted jobs | Read-only token, CI env only | Same |
| docker-build | Build only, no push | Same |
| dependency-review | May fail if graph unavailable | Full |
| secrets (Gitleaks) | Runs on PR diff | Same |

## Not executed on fork PRs with secrets

- No repository secrets referenced in CI jobs
- No image push, attestation, or package publish
- No production DB/email/payment credentials

## Privileged jobs

postgres-integration, compose-smoke, container-scan run on **main** only (trusted branch), not untrusted fork PRs for extended infra tests.

Fork PRs still get full unit/API test coverage via backend + frontend jobs.

## pull_request_target

**Not used.** All CI uses `pull_request` / `push` / `merge_group`.
