# Auth Token Model

## Access token

- Stored in module-level memory variable in `frontend/src/services/api.js`
- Never written to localStorage/sessionStorage/IndexedDB
- Sent as `Authorization: Bearer` header
- Short-lived JWT; refreshed via `/api/auth/refresh`

## Refresh token

- HttpOnly cookie (`refresh_token` dev / `__Host-refresh_token` production)
- `Secure` in production, `SameSite=Lax`, `Path=/`
- Rotated server-side; reuse detection in auth-token repository
- Not accessible to JavaScript

## Session restore after reload

1. `AuthProvider` calls `refreshSession()` → POST `/api/auth/refresh` with cookie
2. On success, memory access token set; `getCurrentUser()` → `/api/auth/me`
3. Role, email verification, MFA requirement loaded from server — not from storage

## CSRF / mutations

- SameSite=Lax refresh cookie + CORS allowlist
- Sensitive commands use idempotency keys (BUS-005)
- No refresh token in JS-readable storage

## Logout

- POST `/api/auth/logout` clears refresh cookie server-side
- Frontend clears memory token, AuthContext, idempotency map, legacy keys
- `BroadcastChannel('ais.auth.logout')` notifies other tabs (no PII in event)

## Account switching

- New login triggers fresh `/api/auth/me`
- IntakeContext resets local state and loads server draft for new `user.id` only
- Legacy storage cleanup on logout
