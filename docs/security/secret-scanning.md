# Secret scanning

## GitHub (recommended)

If GitHub Advanced Security is available on your organization:

1. Open repository **Settings → Code security and analysis**.
2. Enable **Secret scanning**.
3. Enable **Push protection** to block commits containing known secret patterns.

These use GitHub's built-in detectors (API keys, tokens, cloud credentials) without extra CI noise.

## Repository hygiene

- **Never commit** `.env`, production credentials, or `DOCUMENT_ENCRYPTION_KEY_BASE64`.
- Use `.env.example` and `backend/.env.production.example` with placeholders only.
- Rotate any secret that was ever committed, even if removed in a later commit.
- Prefer platform secret managers for production (Render, Fly, AWS SSM, etc.).

## If a secret is leaked

1. Rotate the secret immediately (treat as active compromise until rotated).
2. Revoke related sessions if auth secret (`AUTH_TOKEN_SECRET`).
3. Review audit logs for unauthorized use.
4. Follow [incident-response-plan.md](./incident-response-plan.md).

## CI fallback (enabled)

This repo runs **Gitleaks** in `.github/workflows/ci.yml` as a blocking PR/main gate. Configure GitHub secret scanning separately per [GITHUB_SETTINGS_RUNBOOK.md](../security-remediation/ci/GITHUB_SETTINGS_RUNBOOK.md).

Do not combine multiple secret scanners in CI.

## Pre-commit checklist

- [ ] No `.env` files staged
- [ ] No hardcoded passwords, API keys, or encryption keys
- [ ] Placeholders only in example env files

## Related documents

- [incident-response-plan.md](./incident-response-plan.md)
- [security-hardening-checklist.md](./security-hardening-checklist.md)
