# CI-001 Implementation

Date: 2026-07-06

## Status

**CI-001:** `REPOSITORY_FIXED_REMOTE_ENFORCEMENT_NOT_VERIFIED`

## Required aggregate check

Stable job name: **`ci-required`**

## Workflows

| File | Role |
| ---- | ---- |
| `.github/workflows/ci.yml` | PR + main blocking CI |
| `.github/workflows/security-scheduled.yml` | Weekly informational security |
| `.github/workflows/release-readiness.yml` | Manual pre-release |

## Action SHAs (verified 2026-07-06 via GitHub API)

| Action | Tag | SHA |
| ------ | --- | --- |
| actions/checkout | v4 | `34e114876b0b11c390a56381ad16ebd13914f8d5` |
| actions/setup-node | v4 | `49933ea5288caeca8642d1e84afbd3f7d6820020` |
| actions/upload-artifact | v4 | `ea165f8d65b6e75b540449e92b4886f43607fa02` |
| actions/download-artifact | v4 | `d3f86a106a0bac45b974a628896c90dbdf5c8093` |
| github/codeql-action | v3 | `411c4c9a36b3fca4d674f06b6396b2c6d23522c6` |
| actions/dependency-review-action | v4 | `2031cfc080254a8a887f58cffee85186f0e49e48` |
| gitleaks/gitleaks-action | v2 | `ff98106e4c7b2bc287b24eaf42907196329070c7` |
| aquasecurity/trivy-action | 0.28.0 | `915b19bbe73b92a6cf82a1bc12b087c9a19a5fe2` |
| zaproxy/action-baseline | v0.14.0 | `7c4deb10e6261301961c86d65d54a516394f9aed` |
| anchore/sbom-action | v0.20.0 | `e11c554f704a0b820cbf8c51673f6945e0731532` |
| docker/setup-buildx-action | v3 | `8d2750c68a42422c14e847fe6c8ac0403b4cbd6f` |

See also: WORKFLOW_MATRIX.md, REQUIRED_CHECKS.md, GITHUB_SETTINGS_RUNBOOK.md
