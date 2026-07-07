# Required CI Checks

## Stable required check name

```
ci-required
```

## Recommended GitHub required status checks

1. **ci-required** (aggregate)
2. **Dependency Review** (PR)
3. **CodeQL**

Remote enforcement: **NOT_VERIFIED** (gh unavailable 2026-07-06).

## Aggregate behavior

- `if: always()` on `ci-required`
- Fails on upstream failure/cancelled/unexpected skip
- PR: allows skip for postgres-integration, compose-smoke, container-scan
- Push/main: requires all main-branch jobs

See GITHUB_SETTINGS_RUNBOOK.md for branch protection setup.
