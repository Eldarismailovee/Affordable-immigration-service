# Матрица фактической реализации

Статусы: `COMPLETE`, `PARTIAL`, `STUB`, `BROKEN`, `NOT_IMPLEMENTED`, `NOT_VERIFIED`. `COMPLETE` означает, что цепочка найдена и релевантно проверена; это не production-readiness всего компонента.

| Функция | Backend | Frontend | БД | Авторизация | Тесты | Итоговый статус | Доказательство / условие |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Public marketing/legal pages | N/A | Да | N/A | Public | Static source tests | COMPLETE | `HomePage`, legal/accessibility pages; production Vite build passed |
| Case fit review | Поля contract неполны | Форма есть | Relationship/location/deadline не сохраняются | Public→register | Только source-regex | BROKEN | `CaseReviewPage` fields strip-ятся `finalIntakeSchema`; FUNC-001 |
| Registration/login/access session | Да | Да | users + refresh tokens | Public auth/rate limit | API/mock + unit pass | PARTIAL | Core работает; first user becomes admin (SEC-001), email unverified не блокирует login |
| Refresh/logout | Rotation/reuse revoke | Auto refresh in memory token client | refresh token rows | HttpOnly cookie + Bearer | API/unit pass | COMPLETE | SameSite=Lax/Secure prod; no staff session UI/logout-all |
| Email verification | Token lifecycle | API functions, отдельного complete UX не найдено | verification tokens | Request auth / confirm public token | Unit pass | STUB | Email provider отсутствует; production token не доставляется |
| Password reset | Token/password/revoke logic | API functions; dedicated route/page не найден | reset tokens | Public token | API/unit pass on mocks | STUB | Delivery stub; production user не получает token |
| Pricing preview | Backend authoritative endpoint | Дублированный hook/UI | Persisted totals on intake | Public | Core pricing files empty | PARTIAL | Logic exists and matches current numbers, but no behavior tests and duplicate source |
| Agreement preview | HTML generation + escaping | Render with sanitizer | Не сохраняется | Account auth | Indirect only | PARTIAL | Preview works by code; no end-to-end browser/API proof |
| Final intake submission | Atomic 5-row UoW | Booking step calls API | lead/intake/booking/payment/sync | Account owner | Restricted-path only; no happy persistence test | PARTIAL | Local runtime ready, but fields lost and no idempotency |
| Account lead list | Filter by `user_id` | Account page | PostgreSQL query | Owner | IDOR/API mock pass | COMPLETE | Hard cap 100, no pagination |
| Admin lead list/detail | Да | Да | Lateral latest child queries | admin/attorney | API mock pass | PARTIAL | No real-DB query test; attorney visibility global to all workflow leads |
| Conflict check | Create/update/get | Lead detail UI | `lead_conflict_checks` | staff | API/policy pass | PARTIAL | No concurrency/real-DB test |
| Attorney review/state machine | Policies/services | Lead detail UI | leads/intakes | staff; delete admin | API/policy pass | PARTIAL | No optimistic lock; parallel transitions possible |
| Agreement generation/approval | Draft/approve/gates | Admin/detail + client view | agreements unique per lead | staff; owner read | Policy/API access pass | PARTIAL | PDF runtime not exercised in audited current image; HTML stored plaintext in DB |
| Onboarding packet/PDF | Draft/approve/gates | Admin/detail + client view | onboarding unique per lead | staff; owner read | Policy/API access pass | PARTIAL | Same PDF/real-DB limitations; guidance recommendation gate exists |
| Standalone booking endpoint | Echo only, no validation/persistence | Не используется | Нет write | Account auth | Не найдено | STUB | `booking.service.js` returns 201-shaped object only |
| Booking within intake | Persisted in UoW | Да | bookings | Account auth | Happy path absent | PARTIAL | Works by code; not real-DB verified |
| Manual payment status | Status + intake sync transaction | Admin controls | payments/intakes | admin | API/policy pass | PARTIAL | Audit-in-transaction failure bug; no provider reconciliation |
| Hosted payment link | HTTPS validation | Admin set/open link | payments | admin | API/unit pass | PARTIAL | Any HTTPS host allowed when allowlist empty; no PSP/webhook |
| Docketwise sync | Local DB mutation only | Admin trigger/status | docketwise_sync/intake flag | admin | No vendor contract test | STUB | Marks `synced` without vendor call |
| Site settings | Public get/admin update | Provider/admin page | site_settings | admin mutate | Limited | PARTIAL | Image URL schema accepts arbitrary strings; no history/versioning |
| Image upload/serve | MIME+magic+path+size; optional scan | Admin upload | File only, no metadata table | admin upload; public read | Storage unit tests | PARTIAL | Scanner off by default; no lifecycle/object storage |
| Cookie consent/GPC | Log service | Consent context/banner | consent logs | Public/optional user | API/schema/frontend source pass | COMPLETE | Retention execution depends on unscheduled job |
| Email preferences/unsubscribe | Suppression/consent logic | Pages/API | suppressions/users | Public token or account | API/unit pass | PARTIAL | Actual marketing delivery remains stub |
| DSAR create/list/detail | Да | Public/account/admin UIs partly | requests/events | owner/staff | API/service mock pass | PARTIAL | Real identity procedure operational, not automated |
| DSAR JSON/PDF export | Build/export/PDF file | Download endpoints; admin UI | JSON/path + file | verified owner/admin generate | Service/API mock pass | PARTIAL | Optional encryption; no real filesystem/DB E2E |
| DSAR correction/restriction/objection/CCPA | Да | Admin detail actions partly | multiple tables | admin; legal hold attorney | Unit/API mock pass | PARTIAL | Multi-write operations not atomic |
| DSAR deletion | User/lead contact anonymization | Admin action | Child PII remains | verified admin, no hold | Superficial unit | BROKEN | Marks completed while intake/payment/document PII remains |
| Retention | Policies, CLI/admin execution | No ops UI except admin endpoint | due fields/indexes | admin/manual CLI | Policy/service mock pass | PARTIAL | No cron/worker/scheduler |
| Admin/user management | list/role/delete | list/role UI | users | admin | API/policy pass | PARTIAL | Transaction audit flaw; delete UI/API client missing |
| Audit events | Structured events + admin list | No broad audit UI found | audit_events/admin_audit_log | admin | API/redaction tests | PARTIAL | Best-effort fail-open; no alert on gaps |
| Health/readiness | `/health`, `/ready` | N/A | DB + migration check | Public | Unit + live smoke pass | COMPLETE | Live `/ready`: 14 expected/applied, 0 pending |
| Real email delivery | No | No | No delivery state | N/A | No | NOT_IMPLEMENTED | Stub only |
| Live CRM integration | No | Status UI only | Simulated status | admin | No | NOT_IMPLEMENTED | Stub only |
| Queue/worker/retry/DLQ | No | N/A | No job table | N/A | No | NOT_IMPLEMENTED | All processing request/CLI/process-local |
| Cache/Redis | No | N/A | No | N/A | No | NOT_IMPLEMENTED | Not required at present |
| OpenAPI/versioned API | No | Handwritten client | N/A | N/A | No contract test | NOT_IMPLEMENTED | API is unversioned `/api` |
| Backup/restore automation | No | N/A | Named volumes | Ops | No drill | NOT_IMPLEMENTED | Runbook is TODO scaffold |
| Metrics/tracing/alerts | No | No | N/A | Ops | No | NOT_IMPLEMENTED | Pino/request ID only |
| Mobile/Desktop apps | No | No | N/A | N/A | No | NOT_IMPLEMENTED | Scope not present |

## Основной пользовательский сценарий

Статус: **NOT_VERIFIED end-to-end / PARTIAL по коду**. Регистрация, формы, API и persistence components существуют; 299 backend tests и 12 frontend tests проходят, live stack ready. Но successful intake не покрыт real-DB/API/E2E test, case review fields теряются, email не доставляется, а production staff workflow зависит от stub integrations.
