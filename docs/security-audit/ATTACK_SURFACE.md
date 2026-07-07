# Attack Surface Inventory

## Web pages

Public: `/`, `/start`, `/case-review`, `/availability`, pricing/services content, login/register, privacy/terms/disclaimer/accessibility, cookie preferences, unsubscribe. Authenticated: `/account`, intake flow, agreement/onboarding views, email preferences. Privileged: `/admin`, lead detail, users, DSAR, site settings. Frontend route guards are navigation controls only; API middleware is authoritative.

## API surface

| Поверхность | Endpoint/компонент | Доступ | Данные | Контроль | Риск |
|---|---|---|---|---|---|
| Health | `GET /api/health`, `/api/ready` | Anonymous | service/DB readiness | general rate limit | Low disclosure |
| Auth | `POST /api/auth/register` | Anonymous | identity/password | Zod, 10/15m IP | Critical bootstrap role |
| Auth | login/refresh/logout/me | Mixed | credentials/tokens | scrypt, JWT, refresh rotation | Medium; no MFA |
| Recovery | password-reset request/confirm | Anonymous | email/reset token | generic response, one-time hash | False delivery |
| Verification | email-verification request/confirm | Mixed | email/token | opaque token | Not enforced for access |
| Pricing | `POST /api/public/pricing/calculate` | Anonymous | package choices | server calculator, Zod | Low |
| Privacy | `POST /api/public/privacy/request` | Anonymous | email/DSAR message | strict Zod, general limit | spam/duplicates |
| Consent | `POST /api/public/cookie-consent` | Anonymous | consent metadata/IP | Zod | privacy retention |
| Public files | `GET /api/public/uploads/images/:filename` | Anonymous | admin-uploaded images | basename/magic-byte checks | public-by-design |
| Unsubscribe | GET token / POST | Anonymous | unsubscribe token | token validation | token logged in URL |
| Intake | `POST /api/account/intake` | User | legal PII, booking/payment | auth, Zod, DB transaction | field loss, duplicates |
| Booking | `POST /api/account/booking` | User | email/type | auth only | fake success/no save |
| Leads | `GET /api/account/leads` | User | owned leads | user-id filter | ownership control present |
| Documents | account agreement/onboarding GET/PDF | Owner/staff/admin | legal HTML/PDF | ownership + approval for PDF | Chromium resource risk |
| DSAR self-service | account DSAR list/detail/export/PDF | User-owner | highly sensitive export | ownership + identity verified | export-at-rest concern |
| Lead admin | `/api/admin/leads/**` | Admin/attorney | all lead/legal PII | role + workflow policies | high-value surface |
| User admin | `/api/admin/users/**` | Admin | roles/accounts | admin role + last-admin policy | privilege management |
| DSAR admin | `/api/admin/dsar/**` | staff read; admin mutate | PII/rights workflow | role checks | incomplete deletion |
| Integrations | Docketwise stub/sync | Admin | intake/lead metadata | admin role | false synced state |
| Payments | payment status/hosted URL | Admin | payment metadata/link | admin role, HTTPS parser | default-allow hosts |
| Upload | `POST /api/admin/uploads/image` | Admin | image | size/MIME/magic bytes | vulnerable Multer, public output |
| Retention | `/api/admin/retention/**` | Admin | bulk lifecycle actions | role, bounded limit | destructive; no scheduler |
| Audit | `GET /api/admin/audit-events` | Admin | security logs | role, max 200 | sensitive log access |

## Data and infrastructure

- PostgreSQL through `pg`; queries are parameterized. The only dynamic table identifier is selected from a fixed `RETENTION_TABLES` map.
- Local volumes: `/app/uploads`, `/app/var/dsar-exports`, PostgreSQL `pgdata`.
- Chromium launches per PDF job with JS and outbound requests disabled, but `--no-sandbox` and no job timeout.
- Docker publishes only reverse proxy port 80 in Compose; production ingress is unknown.
- Background work is CLI/admin-triggered retention. No scheduler, worker broker, webhook receiver, SMS or real payment API was found.
- External browser request: Google Fonts loads before any consent decision.

## Inventory limitations

Production load balancer, cloud storage, DB grants, TLS certificate, WAF, SIEM, email/provider configuration and registry settings were not available. No external host was scanned.
