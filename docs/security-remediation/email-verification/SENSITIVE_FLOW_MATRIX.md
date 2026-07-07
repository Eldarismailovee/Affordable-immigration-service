# Sensitive Flow Matrix — AUTH-003

| Endpoint/операция | Anonymous | Unverified user | Verified user | MFA | Step-up | Причина |
| ----------------- | --------: | --------------: | ------------: | --: | ------: | ------- |
| POST /api/auth/register | ✓ | — | — | — | — | Public onboarding |
| POST /api/auth/login | ✓ | restricted session | ✓ | privileged only | — | Auth |
| POST /api/auth/refresh | — | ✓ | ✓ | inherits session | — | Session continuity |
| POST /api/auth/logout | — | ✓ | ✓ | ✓ | — | Safe exit |
| GET /api/auth/me | — | ✓ | ✓ | ✓ | — | Minimal profile |
| POST /api/auth/email/resend | ✓ neutral | — | — | — | — | Recovery without enumeration |
| POST /api/auth/email-verification/request | — | ✓ | — | — | — | Resend (auth) |
| POST /api/auth/email/verify | ✓ | ✓ | — | — | — | Token consumption |
| POST /api/auth/email/change | — | ✓ | ✓ | privileged | — | Fix/change email |
| POST /api/account/intake | — | ✗ | ✓ | — | — | Legal PII submission |
| POST /api/account/booking | — | ✗ | ✓ | — | — | Appointment data |
| POST /api/account/agreement/** | — | ✗ | ✓ | — | — | Legal documents |
| GET /api/account/agreement/**/pdf | — | ✗ | ✓ | — | — | Sensitive download |
| POST /api/account/dsar | — | ✗ | ✓ | — | — | Privacy rights |
| GET /api/account/dsar/**/export* | — | ✗ | ✓ | — | — | PII export |
| PATCH /api/account/email-preferences | — | ✗ | ✓ | — | — | Marketing consent |
| POST /api/auth/mfa/** (privileged) | — | ✗ | ✓ | — | — | Requires verified email before MFA |
| /api/admin/** | — | ✗ | ✗ | ✓ | step-up on sensitive | Privileged operations |

Unverified users retain: login (restricted), logout, resend, verify, change email (with password), `/api/auth/me`.
