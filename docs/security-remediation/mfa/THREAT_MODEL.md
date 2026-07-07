# MFA Threat Model (AUTH-002)

Date: 2026-07-06. Scope: TOTP MFA for privileged roles (`admin`, `attorney`).

## Assets

- TOTP secrets (encrypted at rest)
- Recovery codes (scrypt hashes)
- MFA challenge tokens (SHA-256 hashes, server-side)
- Access/refresh tokens with `mfa`, `mfaAt`, `secVer`, `sid` claims
- Session security version on `users` and `auth_refresh_tokens`

## Threats and mitigations

| Threat | Mitigation |
|--------|------------|
| Stolen staff/admin password | Password-only login returns short-lived MFA challenge, not privileged token |
| Stolen access token without MFA claim | `requirePrivilegedMfa` blocks `/api/admin` |
| Stolen refresh token | Rotation + reuse detection; refresh preserves `mfa_completed_at` only from DB row |
| TOTP replay | `last_used_timestep` atomic update; otplib `afterTimeStep` |
| Brute force TOTP/recovery | Per-challenge attempt counter; rate limits; challenge invalidation |
| DB theft of TOTP secret | AES-256-GCM with key outside DB (`MFA_ENCRYPTION_KEY`) |
| QR/setup interception | One-time enrollment response; secret never re-shown; pending invalidated on restart |
| Recovery code brute force | scrypt hashes; rate limits; single-use atomic consume |
| Recovery code reuse | `used_at` set atomically on consume |
| Attacker disables MFA | Blocked for privileged roles (`MFA_DISABLE_BLOCKED`) |
| Factor replacement after session hijack | Enrollment/password/MFA change bumps `session_security_version` and revokes refresh tokens |
| Password reset bypass | Password reset revokes refresh tokens and bumps `session_security_version` |
| Refresh endpoint bypass | Refresh copies `mfa_completed_at` from token row only |
| API endpoint bypass | Admin router uses `requirePrivilegedMfa`; sensitive routes use `requireStepUp` |
| Client privilege escalation | JWT claims server-issued only; `mfa` not accepted from request body |
| CSRF on enrollment/disable | Refresh cookie `SameSite=Lax`; state-changing routes rate-limited |
| Enrollment race | Single pending TOTP per user (unique partial index) |
| Clock drift | `epochTolerance: 30` (one step) |
| OTP/secret in logs | Audit redaction; no secrets in audit metadata |
| Secret in frontend state | Secret/recovery codes cleared after display; not stored in localStorage |

## Residual risks

See `REMAINING_RISKS.md`.
