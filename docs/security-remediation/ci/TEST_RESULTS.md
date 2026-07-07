# CI-001 Test Results

Date: 2026-07-06  
Environment: local Linux, Node v26.2.0, Docker 29.6.1

## Workflow validation

| Check | Result |
| ----- | ------ |
| validate-workflows.js | PASS |
| workflow-policy.test.js (6 tests) | PASS |

## Backend

| Check | Result |
| ----- | ------ |
| npm ci | PASS |
| npm test | PASS (336 pass, 2 skipped — PG integration without flags) |
| check-npm-audit.js --production | PASS (0 Critical/High) |

## Frontend

| Check | Result |
| ----- | ------ |
| npm ci | PASS |
| npm test | PASS (99) |
| npm run lint | PASS |
| npm run build | PASS |
| check-npm-audit.js --production | PASS (0 Critical/High) |

## Docker

| Check | Result |
| ----- | ------ |
| docker compose config | PASS |
| backend image build | PASS |
| frontend image build | PASS |
| compose smoke | NOT RUN (disk constraint; script present) |
| Trivy container scan | NOT RUN locally |

## PostgreSQL integration

NOT RUN locally (no live PostgreSQL service in test run). CI job configured with flags on main.

## Remote GitHub

NOT_VERIFIED_AUTH_UNAVAILABLE (`gh` not installed)

## CI-001 verdict

REPOSITORY_FIXED_REMOTE_ENFORCEMENT_NOT_VERIFIED
