# Security Baselines

## npm (`security/dependency-audit-baseline.json`)

No active exceptions. Production Critical/High: **0** (backend + frontend, 2026-07-06).

Fixes applied instead of baselines:
- ws GHSA-96hv-2xvq-fx4p → overrides `^8.21.0`
- react-router GHSA-49rj-9fvp-4h2h → react-router-dom `^7.18.1`

## Container (`security/container-scan-baseline.json`)

No active exceptions. First Trivy results pending main CI run.

## Release impact

Moderate/low dev dependencies remain; not PR production gate blockers.
