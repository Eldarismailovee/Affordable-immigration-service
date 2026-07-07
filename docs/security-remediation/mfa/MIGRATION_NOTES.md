# MFA Migration Notes

## 017_privileged_mfa.sql

Adds:

- `users.session_security_version`
- `auth_refresh_tokens.mfa_completed_at`, `session_security_version`
- `user_mfa_factors`, `user_mfa_recovery_codes`, `auth_mfa_challenges`

Apply via `npm run migrate` before deploying MFA-enabled backend.

Production requires `MFA_ENCRYPTION_KEY` (32-byte base64).

Existing privileged users must complete forced enrollment on next login.
