# CI Command Ledger

| Command | Purpose | Result |
| ------- | ------- | ------ |
| `node scripts/ci/validate-workflows.js` | Workflow policy | PASS |
| `node --test tests/ci/workflow-policy.test.js` | CI regression tests | PASS |
| `cd backend && npm ci && npm test` | Backend suite | PASS 336/338 (2 skip) |
| `cd frontend && npm ci && npm test && npm run lint && npm run build` | Frontend | PASS |
| `node scripts/ci/check-npm-audit.js backend ... --production` | Backend audit gate | PASS |
| `node scripts/ci/check-npm-audit.js frontend ... --production` | Frontend audit gate | PASS |
| `docker compose config --quiet` | Compose validation | PASS |
| `docker build ./backend` | Backend image | PASS |
| `docker build ./frontend` | Frontend image | PASS |

Action SHA lookup: GitHub API commits endpoint (2026-07-06).
