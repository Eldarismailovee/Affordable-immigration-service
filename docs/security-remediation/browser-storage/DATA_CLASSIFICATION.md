# Data Classification — Browser Storage

## Restricted

Must not persist in `localStorage`, `sessionStorage`, IndexedDB, or Cache Storage:

- Access/refresh tokens (JS-readable)
- Passwords, MFA secrets, OTP, recovery codes, challenge tokens
- Email/password-reset/verification tokens
- Immigration/legal intake answers, case-review answers
- DSAR exports, payment-sensitive data, agreement/PDF contents
- Admin security data, uploaded document metadata with PII

## Sensitive PII

Must not persist in browser storage; server-side drafts only when authenticated:

- Email, name, phone, address, citizenship, immigration status
- Relationship, location, deadlines, matter/booking/intake answers

## Internal

Short-lived, non-authoritative client hints only:

- User id display, role hints from `/api/auth/me`, workflow step flags
- Never used as sole authorization source

## Non-sensitive preferences

Explicit allowlist via `safeBrowserStorage.js`:

- `ais.ui.theme`, `ais.ui.language`, `ais.ui.cookieConsent`
- `ais.ui.reducedMotion`, `ais.ui.density`, `ais.ui.cookieBannerDismissed`
- `ais.storage.version`

Client-side encryption of PII in browser storage is explicitly prohibited.
