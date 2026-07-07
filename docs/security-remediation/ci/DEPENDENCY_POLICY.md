# Dependency Policy

## PR: GitHub Dependency Review

- `fail-on-severity: high`
- Deny licenses: GPL-3.0, AGPL-3.0
- Feature availability: **REMOTE_FEATURE_NOT_VERIFIED**

## Fallback: check-npm-audit.js

- Production scope (`--omit=dev`)
- Baseline: `security/dependency-audit-baseline.json`
- Fail closed on new Critical/High, expired baseline, malformed baseline

## Current baseline

Empty — production audit passes after ws/react-router/vite fixes.

## Dependabot

backend npm, frontend npm, GitHub Actions, Docker — see `.github/dependabot.yml`
