# Test Results

Date: 2026-07-06

| Команда | Рабочая директория | Exit code | Passed | Failed | Ограничения |
| ------- | ------------------ | --------: | -----: | -----: | ----------- |
| `npm test` | backend | 0 | 315 | 0 | In-memory API tests; no live PostgreSQL integration for DSAR deletion |
| `npm ls multer` | backend | 0 | — | — | Confirms 2.2.0 |
| `npm audit --omit=dev` | backend | 0 | — | — | 6 remaining advisories (qs, ws transitive); multer CVEs cleared |
| `npm test` | frontend | 0 | 88 | 0 | Static/source tests only |
| `npm run lint` | frontend | 0 | — | — | — |
| `npm run build` | frontend | 0 | — | — | Vite production build succeeded |
| `docker compose config` | repo root | 0 | — | — | Syntax valid; build/up not executed |
| `docker compose build` | repo root | — | — | — | NOT_VERIFIED (not run in this pass) |
| PostgreSQL integration (DSAR deletion rollback) | — | — | — | — | NOT_VERIFIED_ENVIRONMENT — no test DB available |
| DAST / live proxy header tests | — | — | — | — | NOT_VERIFIED |

## CI-001 pass (2026-07-06)

See `docs/security-remediation/ci/TEST_RESULTS.md`.

| Check | Result |
| ----- | ------ |
| Backend npm test | 336 pass, 2 skip |
| Frontend test/lint/build | 99 pass, PASS, PASS |
| Production npm audit | 0 Critical/High |
| Workflow validation | PASS |
| Docker build | PASS |
| Remote branch protection | NOT_VERIFIED_AUTH_UNAVAILABLE |

## BUS-005 pass (2026-07-06)

See `docs/security-remediation/idempotency/TEST_RESULTS.md`.

| Check | Result |
| ----- | ------ |
| Backend npm test | 348 pass, 3 skip |
| Frontend test/lint/build | 106 pass, PASS, PASS |
| Idempotency API tests | 5 pass |
| Local PostgreSQL idempotency integration | NOT_VERIFIED (no local PG) |
| CI postgres-integration | Configured with RUN_IDEMPOTENCY_PG_INTEGRATION=1 |

## Notes

- Prior sandbox EPERM listener issues did not recur; API suites ran via in-memory repository mocks.
- Production env tests now require `PAYMENT_HOST_ALLOWLIST` when `NODE_ENV=production`.
