# AUTH-003 Implementation

## Server-side gates

- `requireVerifiedEmail` checks `email_verified_at` from DB-backed `req.user`, not JWT/body alone.
- Applied to `/api/account/**` and `/api/admin/**`.
- Privileged login blocked until email verified; then MFA applies (AUTH-002 preserved).

## Token model

- Opaque 48-byte base64url token; SHA-256 hash stored in `email_verification_tokens`.
- Columns: `email`, `purpose` (`registration|resend|email_change`), TTL, `consumed_at`, `invalidated_at`.
- Single active token policy: new issuance invalidates prior tokens for user.

## Email change (variant B)

- `pending_email` stored until verification; primary email unchanged until token consumed.
- Verification promotes pending email, sets `email_verified_at`, bumps `session_security_version`, revokes refresh tokens.

## Provider semantics

- `not_configured` / `accepted` / `failed` — never claim delivery when provider not configured.
- Audit events omit token, URL, and raw provider payload.

## Initial admin

- Created unverified via deployment script; requires email verification + MFA before admin API access.
- `--password-stdin` / `--password-file` supported; no password in CLI args.
