# CI Permissions Matrix

Default: `contents: read`

| Workflow | Job | Permission | Value | Reason |
| -------- | --- | ---------- | ----- | ------ |
| CI | default | contents | read | Checkout |
| CI | dependency-review | pull-requests | read | PR diff |
| CI | codeql | security-events | write | SARIF upload |
| CI | codeql | packages | read | Dependency graph |
| CI | container-scan | security-events | write | Scan results |

Not granted: `write-all`, `contents: write`, fork secrets.
