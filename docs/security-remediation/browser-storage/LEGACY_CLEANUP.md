# Legacy Browser Storage Cleanup

Version: `CURRENT_SAFE_STORAGE_VERSION = 2` (`frontend/src/services/safeBrowserStorage.js`)

## Removed keys

| Key | Reason |
| --- | --- |
| `immigration-intake` | Full intake PII |
| `cookie_consent_preferences` | Migrated to `ais.ui.cookieConsent` |
| `auth`, `token`, `access_token`, `refresh_token` | Auth secrets |
| `user`, `profile`, `session` | Profile/role cache |
| `intake`, `intake-draft`, `case`, `case-review`, `draft` | Form PII |
| `mfa`, `mfa_challenge`, `mfa_secret`, `recovery_codes` | MFA material |
| `email_verification`, `verification_token`, `password_reset`, `reset_token` | One-time tokens |
| `payment`, `booking`, `dsar`, `agreement`, `document`, `idempotency` | Sensitive workflow |

Prefix sweep: `immigration-*`, `ais-auth-*`, `ais-intake-*`, `ais-user-*`

## Behavior

1. On app boot (`main.jsx`): run `cleanupLegacyBrowserStorage()`
2. If stored version < 2: delete known + pattern-matched keys; set version 2
3. Never log removed values; no backup; no server upload of legacy data
4. On logout: force cleanup + session navigation keys
5. Preserves allowlisted keys (`ais.ui.theme`, etc.)

## Session storage

Removes legacy keys matching intake/auth/token patterns from `sessionStorage`.

Do **not** use `localStorage.clear()` — only targeted project keys.
