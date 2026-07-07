# Operational Runbook — Email Verification

## Registration

User registers → unverified account + hashed token. If provider not configured, UI shows honest state.

## Resend

Use `POST /api/auth/email/resend` (neutral) or authenticated `POST /api/auth/email-verification/request`. Rate limits: account, email, IP.

## Verification

User submits token via `POST /api/auth/email/verify`. Success revokes old sessions and issues fresh verified session.

## Expired / invalid token

Neutral invalid-token response; user may resend (subject to cooldown/hourly cap).

## Lost mailbox

User changes email via `POST /api/auth/email/change` with password (MFA for privileged).

## Provider outage

Status remains `not_configured` or `failed`; do not mark verified manually without operator policy.

## Initial admin

Run `npm run create-initial-admin -- --email ... --password-stdin`. Complete email verification and MFA enrollment before admin use.

## Token leakage

Revoke sessions (`session_security_version` bump on verify/change), invalidate tokens, audit review — do not log leaked tokens.
