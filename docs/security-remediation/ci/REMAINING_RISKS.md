# CI Remaining Risks

## Remote enforcement

Branch protection and required checks not verified. Workflows alone do not block merge until GitHub settings applied.

## Container scan baseline

First Trivy results may require targeted baselines for unfixed OS CVEs in base images.

## Compose smoke

Not executed locally; validate on first main CI run.

## CODEOWNERS

Placeholder `@org/security-team` must be replaced before enforcement.

## PG integration tests

Current tests assert environment + migration presence; expand with behavioral tests in future passes.

## DAST

Informational only (Variant B). Not a merge gate.

## Artifact attestation

Not implemented (plan/visibility limitation).

## Disk

Local environment at 100% disk during doc write; CI runners unaffected.

## Next priority finding

**BUS-005** — idempotency for sensitive commands.
