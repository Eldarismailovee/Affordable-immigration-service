# MFA Operational Runbook

## Initial admin enrollment

1. Provision: `INITIAL_ADMIN_PASSWORD=... npm run create-initial-admin -- --email admin@example.com`
2. Sign in at `/login` → redirected to `/mfa/enroll`.
3. Scan QR, confirm first TOTP, save recovery codes offline.

## Lost authenticator

Use a recovery code at `/mfa/verify`, then regenerate codes from MFA settings (future UI) or ask another admin for reset.

## Administrative MFA reset

1. Admin signs in with MFA.
2. Complete step-up if prompted.
3. `POST /api/auth/mfa/admin/reset` with target `userId`.
4. Target user must re-enroll; all sessions revoked.

## Encryption key rotation

1. Set new `MFA_ENCRYPTION_KEY` and increment `MFA_ENCRYPTION_KEY_VERSION`.
2. Re-encrypt factors (migration tooling TBD) or force re-enrollment per user.
3. Document rotation in change record.

## Security incident

Revoke sessions via password reset or MFA admin reset. Review `auth.mfa.*` audit events. Rotate `MFA_ENCRYPTION_KEY` if DB compromise suspected.
