# MFA Step-Up Matrix

| Endpoint | Roles | Reason | Required level | Max age (s) |
| -------- | ----- | ------ | -------------- | ----------- |
| `POST /api/admin/dsar/:id/export` | admin | DSAR JSON export | MFA complete + fresh step-up | 300 |
| `POST /api/admin/dsar/:id/export-pdf` | admin | DSAR PDF export | MFA complete + fresh step-up | 300 |
| `POST /api/admin/dsar/:id/anonymize` | admin | DSAR deletion/anonymization | MFA complete + fresh step-up | 300 |
| `PATCH /api/admin/users/:id/role` | admin | Role change | MFA complete + fresh step-up | 300 |
| `DELETE /api/admin/users/:id` | admin | Staff/admin disable | MFA complete + fresh step-up | 300 |
| `POST /api/auth/mfa/admin/reset` | admin | Administrative MFA reset | MFA complete + fresh step-up | 300 |
| `GET /api/admin/audit-events` | admin | Sensitive audit metadata | MFA complete + fresh step-up | 600 |
| `POST /api/admin/retention/run` | admin | Mass retention purge | MFA complete + fresh step-up | 600 |
| `POST /api/admin/retention/actions` | admin | Retention override / legal hold | MFA complete + fresh step-up | 600 |
| `PUT /api/admin/site-settings` | admin | Site/security settings | MFA complete + fresh step-up | 600 |

All `/api/admin/**` routes additionally require `mfa: true` on the access token via `requirePrivilegedMfa`.

Step-up refresh: `POST /api/auth/mfa/step-up` with TOTP or recovery code updates `mfa_completed_at` on the current refresh session row and re-issues access token.

Error contract: `403` with code `STEP_UP_REQUIRED`.
