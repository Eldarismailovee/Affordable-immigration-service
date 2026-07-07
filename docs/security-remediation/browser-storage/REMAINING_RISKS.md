# DATA-001 Remaining Risks

| Risk | Severity | Notes |
| --- | --- | --- |
| Browser E2E not automated | Low | Manual checklist only |
| XSS still exposes memory session | Medium | Mitigated by CSP; memory tokens still readable under XSS |
| Shared-device browser history | Low | Tokens stripped from URL; sensitive APIs no-store |
| Disk-full deploy environment | Ops | Unrelated; blocked full CI re-run locally |
| LOG-001 | Open | No external error tracker; safeLog added locally only |
| sessionStorage return path | Low | Validated internal paths only; not for PII |

DATA-001 persistent-storage criteria met in code and unit/policy tests.
