# Browser Storage Inventory (DATA-001)

Date: 2026-07-06. Post-remediation snapshot.

| Storage key / location | Storage type | Data | PII | Security-sensitive | Lifetime | Readers | Resolution |
| --- | --- | --- | :-: | :-: | --- | --- | --- |
| `immigration-intake` (legacy) | localStorage | Full intake draft | yes | yes | Until reset | IntakeContext | **REMOVE** (legacy cleanup v2) |
| `cookie_consent_preferences` (legacy) | localStorage | Consent flags | no | no | Persistent | cookieConsent | **REMOVE** → migrate to `ais.ui.cookieConsent` |
| `ais.ui.cookieConsent` | localStorage | Analytics/marketing consent | no | no | Persistent | cookieConsent | **NON_SENSITIVE_LOCAL_PREFERENCE** |
| `ais.ui.theme` | localStorage | Theme | no | no | Persistent | safeBrowserStorage | **NON_SENSITIVE_LOCAL_PREFERENCE** |
| `ais.ui.language` | localStorage | Language | no | no | Persistent | safeBrowserStorage | **NON_SENSITIVE_LOCAL_PREFERENCE** |
| `ais.storage.version` | localStorage | Cleanup version | no | no | Persistent | legacyStorageCleanup | **NON_SENSITIVE_LOCAL_PREFERENCE** |
| `ais.nav.returnPath` | sessionStorage | Internal return path | no | no | Tab session | sessionNavigationStorage | **SHORT_LIVED_SESSION_STATE** |
| Access token | memory (`api.js`) | JWT access | no | yes | Session | api, AuthContext | **MEMORY_ONLY** |
| Refresh token | HttpOnly cookie | Session refresh | no | yes | 14d TTL | backend only | **HTTPONLY_COOKIE** |
| User profile / role | memory (AuthContext) | Display + authz hints | yes | yes | Session | React | **MEMORY_ONLY** (server `/api/auth/me`) |
| MFA challenge / TOTP / recovery | memory (AuthContext) | MFA flow | no | yes | Flow lifetime | React | **MEMORY_ONLY** |
| Intake form answers (authenticated) | server DB `intake_drafts` | Draft PII | yes | yes | 30d TTL | backend + owner | **SERVER_SIDE** |
| Intake form answers (public case review) | React state | Case review PII | yes | yes | Tab lifetime | React | **MEMORY_ONLY** |
| Idempotency-Key | memory Map | Retry keys | no | low | Command lifetime | idempotency.js | **MEMORY_ONLY** |
| React Router `location.state.from` | memory/history | Return path | no | no | Navigation | router | **MEMORY_ONLY** (validated on use) |
| URL `token` (verify/unsubscribe) | URL query | One-time tokens | no | yes | Until processed | page handler | **REMOVE from URL** after POST |
| PDF blob URLs | memory | Document bytes | yes | yes | ≤60s | api openPdf | **MEMORY_ONLY** + revoke |
| IndexedDB / Cache Storage / SW | — | — | — | — | — | — | **Not used** |

No analytics provider is present in the frontend bundle.
