# Route Gate Matrix — AUTH-003

| Route | Auth | Verified email | Role | MFA | Step-up | Test |
| ----- | ---: | -------------: | ---: | --: | ------: | ---- |
| POST /api/auth/register | — | — | — | — | — | ✓ |
| POST /api/auth/login | — | — | — | privileged | — | ✓ |
| GET /api/auth/me | ✓ | — | — | — | — | ✓ |
| POST /api/auth/email/verify | — | — | — | — | — | ✓ |
| POST /api/auth/email/resend | — | — | — | — | — | ✓ |
| POST /api/auth/email/change | ✓ | — | — | privileged | — | ✓ |
| POST /api/account/** | ✓ | ✓ | user+ | — | — | ✓ |
| GET /api/account/** | ✓ | ✓ | user+ | — | — | ✓ |
| /api/admin/** | ✓ | ✓ | admin/attorney | ✓ | varies | ✓ |

Middleware order: `optionalAuth` → `requireAuth` → `requireVerifiedEmail` → `requirePrivilegedMfa` → `requireRole` → `requireStepUp`.
