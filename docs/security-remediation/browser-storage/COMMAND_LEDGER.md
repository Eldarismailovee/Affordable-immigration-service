# DATA-001 Command Ledger

```bash
# Snapshot
pwd && git status --short && git rev-parse HEAD && git branch --show-current

# Frontend verification
cd frontend && npm test && npm run lint && npm run build

# Backend draft tests
cd backend && NODE_ENV=test DATABASE_URL=... AUTH_TOKEN_SECRET=... \
  node --test --experimental-test-module-mocks tests/api/intake-draft.api.test.js
```

Migration apply (deploy): `020_secure_intake_drafts.sql` via standard migration runner.

Legacy cleanup runs automatically on frontend boot — no manual command.
