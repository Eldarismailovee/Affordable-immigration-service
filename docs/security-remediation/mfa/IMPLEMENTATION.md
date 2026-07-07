# MFA Implementation

## Privileged roles

`admin`, `attorney` — defined in `backend/src/constants/domain.js`.

## Login flow

1. `POST /api/auth/login` verifies password.
2. If role is privileged and MFA not enrolled → `mfaEnrollmentRequired` + opaque `mfaChallengeToken` (no access/refresh token).
3. If role is privileged and MFA enrolled → `mfaRequired` + challenge token.
4. Regular `user` role receives full session immediately.

## Challenge flow

- Stored in `auth_mfa_challenges` as SHA-256 hash.
- TTL: `MFA_CHALLENGE_TTL_SECONDS` (default 300s).
- Single-use via `consumed_at`.
- Max attempts: `MFA_MAX_ATTEMPTS`.

## Verification

`POST /api/auth/mfa/verify` with `challengeToken` + TOTP or recovery code → full session with `mfa: true` JWT claim and `mfa_completed_at` on refresh row.

## Enrollment

`POST /api/auth/mfa/enrollment/start` → pending factor + QR (one-time).
`POST /api/auth/mfa/enrollment/confirm` → activates factor, issues recovery codes once, revokes old sessions.

## Recovery

10 single-use codes, scrypt-hashed. Regenerate via `POST /api/auth/mfa/recovery/regenerate` (password + privileged MFA session).

## Disable / reset

- Privileged disable: blocked.
- Admin reset: `POST /api/auth/mfa/admin/reset` with step-up.

## Step-up

`requireStepUp(maxAge)` middleware checks JWT `mfaAt` freshness. Refresh via `POST /api/auth/mfa/step-up`.

## Token claims

Access JWT: `typ=access`, `mfa`, `mfaAt`, `secVer`, `sid`, `role`.

## Session revocation

`session_security_version` bumped on password change, MFA change, role change, MFA reset. Mismatch invalidates tokens.

## Encryption

TOTP secrets: AES-256-GCM, per-record nonce, key from `MFA_ENCRYPTION_KEY`.
