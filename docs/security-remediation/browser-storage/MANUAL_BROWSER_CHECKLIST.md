# Manual Browser Verification Checklist — DATA-001

Use synthetic data only. DevTools → Application.

## Storage inspection (after each flow)

- [ ] Local Storage: only `ais.*` allowlist keys (no `immigration-intake`, `user`, `token`)
- [ ] Session Storage: at most `ais.nav.returnPath` (no form answers)
- [ ] IndexedDB: empty / no app databases
- [ ] Cache Storage: no `/api/account`, `/api/auth`, `/api/admin` entries
- [ ] Cookies: refresh token HttpOnly; no access token cookie
- [ ] Console: no PII/tokens in logs

## Flows

| Flow | Checks |
| --- | --- |
| Registration / login | No tokens in localStorage; session via cookie + memory |
| MFA enroll/verify | No secret/recovery codes in storage after leaving page |
| Email verification | Token removed from address bar after POST |
| Case review (logged out) | Answers not in storage; reload loses data (expected) |
| Intake (logged in) | Draft autosave hits `/api/account/intake/draft`; no localStorage PII |
| Logout | Legacy keys cleared; Back does not show cached account HTML |
| Account switch | User B does not see User A intake draft |
| DSAR / payment / admin | API responses `Cache-Control: no-store` |

## Service worker

- [ ] Not registered in this app (static Vite build only)

## Back/Forward cache

- [ ] After logout, sensitive authenticated pages redirect to login

Record results in `TEST_RESULTS.md`.
