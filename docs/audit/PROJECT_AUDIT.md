# Полный технический аудит проекта

Дата: 2026-07-06  
Audit snapshot: текущий dirty working tree поверх commit `672b74e8d8418d9fc1cdff12d439936f35e38176`. Пользовательские изменения не изменялись; добавлена только `docs/audit/`.

## 1. Executive summary

Проект — web-платформа небольшой immigration law firm: public marketing/legal site, предварительная проверка matter, регистрация, guided intake, lead/attorney workflow, agreements/onboarding PDFs, manual hosted payments, privacy/DSAR, settings/uploads и admin operations. Это содержательный advanced MVP, а не scaffold: live local Compose работает, 14 migrations применены, frontend production build и оба Docker build проходят, полный backend suite — 299/299, frontend — 12/12, lint green.

Однако production launch должен быть остановлен. На пустой БД первый публично зарегистрированный пользователь получает `admin` (SEC-001). Кроме того, case-review location/relationship/deadline теряются, DSAR deletion оставляет child PII при статусе completed, email/Docketwise — stubs с ложными success states, dependency audits содержат high findings и ломают текущий CI, backup/TLS/retention scheduling/MFA/observability не готовы.

## 2. Итоговый verdict

# FAIL

Критерий: существует подтверждённый P0 обход авторизации/privilege escalation и 15 P1 production blockers. `FAIL` не означает, что код не запускается: local runtime/build/tests в значительной части исправны. Он означает, что систему нельзя безопасно передавать в staging с real PII или production без remediation.

| Вопрос | Ответ |
| --- | --- |
| Можно ли локально запустить? | **Да, проверено для текущего Compose:** 4 containers up, backend/Postgres healthy, `/api/ready` 200 |
| Можно ли собрать production build? | **Да:** Vite build и backend/frontend Docker images успешно собраны |
| Проходят ли тесты? | **Да при разрешённом localhost bind:** backend 299/299, frontend 12/12. Первичный sandbox run 41/52 files из-за `listen EPERM`, не code failure |
| Работает ли основной сценарий? | **PARTIAL / end-to-end NOT_VERIFIED:** components есть, но successful real-DB/browser flow не тестируется и case-review fields теряются |
| Готов к staging? | **Нет** для real/sensitive data; после P0 и ключевых P1 — candidate |
| Готов к production? | **Нет** |

## 3. Назначение и границы

Пользователи: prospective client, registered client, operations admin, attorney. Основные scenarios: изучить услуги/цены; пройти case review и intake; запросить консультацию; staff conflict/attorney review; сгенерировать/одобрить документы; manual payment coordination; privacy requests; settings/media.

Граница системы: browser + static frontend + Express API + PostgreSQL + local files + Chromium. Hosted PSP — только URL; email и Docketwise не подключены. Mobile/desktop, cache, queue, worker, object storage, CDN, monitoring platform отсутствуют.

## 4. Фактический стек

Версии ниже — lock/install/runtime evidence, а не только README.

| Компонент | Технология | Версия | Назначение | Источник подтверждения | Состояние |
| --- | --- | ---: | --- | --- | --- |
| Backend runtime | Node.js ESM | 26.2.0 local; engine `>=26 <27`; image `node:26-bookworm-slim` | API/migrations/jobs/PDF orchestration | `backend/package.json`, Dockerfile, `node --version` | Используется; image tag patch floating |
| HTTP API | Express | 4.22.1 installed | Routes/middleware/controllers | backend lock/npm ls | Используется |
| Validation | Zod | 4.3.6 | Request/response/domain schemas | backend package/lock | Используется |
| Database driver | `pg` | 8.20.0 | Pool/SQL/transactions | backend package/lock | Используется |
| Database | PostgreSQL | 16-alpine | System of record | Compose/live readiness | Используется; single instance |
| Auth | `jose`, scrypt | jose 6.2.3 | JWT + password hash | auth utils/package | Используется |
| Upload | Multer | 2.1.1 | Admin images | middleware/package | Используется; high advisory |
| Logging | Pino/pino-http | 10.3.1/11.0.0 | Structured stdout/HTTP logs | package/logger | Используется |
| PDF | Puppeteer Core + Chromium | 24.40.0 + Debian Chromium | Agreements/DSAR PDFs | pdf service/Dockerfile | Используется; no-sandbox |
| Frontend runtime | React/React DOM | 19.2.4 | SPA | frontend lock/npm ls | Используется |
| Routing | React Router DOM | 7.13.2 | Client routing/RBAC UX | frontend lock/App | Используется; affected advisory range |
| Build | Vite | 8.0.10 | Dev/prod bundle | frontend lock/build output | Используется |
| Styling | Tailwind CSS Vite + utility classes | 4.2.2 | CSS/design tokens | package/CSS | Используется |
| Icons | lucide-react | 1.7.0 | UI icons | frontend package | Используется |
| Reverse proxy | Nginx | `stable-alpine` floating | Edge proxy + static serving | Compose/Dockerfiles | Используется; HTTP-only config |
| Containers | Docker/Compose | Docker 29.6.1; Compose 5.1.4 local | Local deployment | command output | Используется |
| CI | GitHub Actions | actions v4/v3 tags | tests/audit/build/CodeQL/ZAP | `.github/workflows` | Частично; current audit fails |
| Queue/cache/worker | — | — | Async/durable work | no config/dependency/process | Не найдено |
| OpenAPI | — | — | API contract | repository search | Не найдено |

Lock files есть в root/backend/frontend (lockfileVersion 3). Root `puppeteer-core@25.1.0` и frontend `puppeteer-core@24.40.0` не используются приложением; backend использует 24.40.0. Caret ranges разрешают updates, lock фиксирует install. Project LICENSE/SBOM отсутствуют. Vendor lock-in пока умеренный: raw SQL/PostgreSQL, Nginx/Docker и provider stubs; будущие email/CRM/PSP adapters нужно изолировать.

## 5. Текущая архитектура

Архитектурный стиль: layered modular monolith + SPA. Controllers в основном thin; application services реализуют use cases; domain policies содержат RBAC/state rules; repositories содержат SQL. Это не strict Clean Architecture: services напрямую импортируют concrete repos, `utils` импортируют services, DSAR/retention/LeadDetail стали god modules.

Подробные diagrams/request/async/deployment flows: [ARCHITECTURE_AS_IS.md](./ARCHITECTURE_AS_IS.md). Целевая эволюция без преждевременных микросервисов: [ARCHITECTURE_TARGET.md](./ARCHITECTURE_TARGET.md).

## 6. Состояние функциональности

Сильные реализованные части: auth token rotation, owner/staff access rules, server pricing, atomic base intake writes, lead state policies, document approval gates, PDF rendering, manual payment metadata, DSAR surface, retention policies, uploads validation, structured response/error schemas, migrations/readiness.

Критические разрывы:

- Case review собирает, но не сохраняет relationship/location/deadline.
- Email verification/reset delivery отсутствует.
- Docketwise «sync» только меняет DB status.
- Standalone booking endpoint даёт 201 без persistence.
- DSAR anonymization не очищает child PII/documents.
- Retention не запускается по расписанию.

Полная матрица: [IMPLEMENTATION_MATRIX.md](./IMPLEMENTATION_MATRIX.md).

## 7. Главные архитектурные проблемы

1. Security provisioning смешан с public registration.
2. Frontend/backend contracts расходятся и Zod молча strip-ит business fields.
3. Privacy workflows не имеют единой transaction/file-job boundary.
4. Best-effort audit используется и внутри active DB transactions.
5. Durable async semantics отсутствуют, но UI/statuses имитируют success.
6. `dsar.service.js` 938 LOC, `LeadDetailPage.jsx` 839 LOC; testability/cohesion снижаются.
7. Pricing/config/dependencies дублируются между packages.

## 8. Security

Положительно: short JWT, rotating hashed refresh tokens, scrypt, Zod, parameterized SQL, ownership tests, Helmet/CORS, HTML escaping/sanitization, upload magic bytes/path controls, HTTPS-only payment URL, audit redaction, non-root backend.

Неприемлемо: SEC-001, high dependency advisory, no staff MFA, HTTP edge, optional/unverified at-rest encryption, PII localStorage, default-open payment host list, scanner off, Chromium no-sandbox. Детально: [SECURITY_REVIEW.md](./SECURITY_REVIEW.md).

## 9. Reliability и согласованность данных

### Failure scenario 1 — повтор intake после timeout

```text
Предусловия: client отправляет валидный intake без idempotency key.
Действие: DB commit успешен, response теряется; client повторяет POST.
Где возникает сбой: сеть после commit.
Что сохраняется: первый и второй полный набор lead/intake/booking/payment/sync.
Что не сохраняется: связь между повторами.
Что видит пользователь: timeout, затем success; дубликат ему не очевиден.
Можно ли безопасно повторить запрос: нет.
Как исправить: scoped Idempotency-Key + payload hash + stored response.
```

### Failure scenario 2 — DSAR deletion partial/completed

```text
Предусловия: verified deletion request без legal hold; PII есть в child tables/docs.
Действие: admin запускает anonymize.
Где возникает сбой: любой write между lead, user, token, DSAR status/event; общей транзакции нет.
Что сохраняется: часть contact anonymization; child PII остаётся всегда.
Что не сохраняется: атомарная гарантия и полный erase.
Что видит пользователь: request может стать completed.
Можно ли безопасно повторить запрос: частично, post-condition отсутствует.
Как исправить: full inventory + atomic DB UoW + durable file cleanup + verified completion.
```

### Failure scenario 3 — audit SQL error внутри transaction

```text
Предусловия: payment/user mutation вызывает recordAuditEvent с transaction client.
Действие: UPDATE успешен, audit INSERT получает SQL/constraint/storage error.
Где возникает сбой: audit service ловит и не rethrow; transaction становится aborted.
Что сохраняется: PostgreSQL COMMIT фактически rollback; service уже держит RETURNING object.
Что не сохраняется: mutation и audit.
Что видит пользователь: возможен success response с несуществующим новым состоянием.
Можно ли безопасно повторить запрос: неопределённо для caller.
Как исправить: rethrow in-UoW или atomic outbox; проверять transaction completion.
```

### Failure scenario 4 — PDF saturation

```text
Предусловия: authenticated users/staff массово вызывают PDF endpoints.
Действие: задачи добавляются в unbounded in-memory queue, Chromium запускается по одному.
Где возникает сбой: memory/latency/container limit.
Что сохраняется: ничего нового; HTTP connections/Promises накапливаются.
Что не сохраняется: durable job/result.
Что видит пользователь: долгий wait/5xx/restart.
Можно ли безопасно повторить запрос: retry увеличивает очередь.
Как исправить: bounded durable queue, timeout/backpressure, worker/resources.
```

## 10. Testing

| Команда | Exit code | Результат | Важные ошибки/оговорки |
| --- | ---: | --- | --- |
| `backend: npm test` в sandbox | 1 | 41/52 file entries | 11 API files не могли `listen 127.0.0.1` (`EPERM`) |
| `backend: npm test` с localhost bind | 0 | **299/299** | Experimental module mocks; unit services логируют caught DB audit errors |
| `frontend: npm test` | 0 | **12/12** | Большинство static source assertions, не rendered UI |
| `frontend: npm run lint` | 0 | Green | Backend lint script отсутствует |
| `frontend: npm run build` | 0 | Green | Bundle JS 450.70 kB / gzip 122.03 kB |
| Backend JS `node --check` | 0 | Green | Syntax only |

Главный test debt: `backend/tests/intake.test.js` и `pricing.test.js` пусты; успешный intake, SQL mappings/transactions, browser E2E, live providers, load и migration upgrade/rollback не покрыты. API tests используют in-memory repositories/module mocks.

## 11. Infrastructure

Dockerfiles воспроизводимо собираются; backend multi-stage/non-root/dumb-init/healthcheck. Compose health-gates Postgres startup and keeps data volumes. Но topology single-host; TLS отсутствует; backend Docker HEALTHCHECK смотрит `/health`, а не `/ready`; frontend runtime root/default; no resource limits/cap drop/read-only; floating base tags; backups/object storage отсутствуют; PDF Chromium no-sandbox.

## 12. CI/CD

Есть PR/main CI, lock-based `npm ci`, audits, backend tests, frontend lint/build, real migration apply/check, Docker builds/Compose validation, CodeQL и weekly/PR ZAP. Недостатки: audit сейчас red; frontend tests не вызываются; backend lint/typecheck отсутствует; DAST warn-only; нет secret/image/license/SBOM scans, pinned action SHAs, artifact provenance, deploy/environment protection/rollback. Branch protection и remote status не проверялись.

## 13. Observability

Есть Pino JSON production logs, request ID, HTTP logging, slow-query metadata, `/health`, cached `/ready`, security/business audit tables. Нет metrics/traces/error tracker/central log retention/alerts/dashboards/SLO/queue monitoring. Audit writes fail-open; admin finish-hook error только логируется.

## 14. Documentation и расхождения

| Документ утверждает | Реальная реализация | Файл-доказательство | Риск |
| --- | --- | --- | --- |
| Node.js 20+ | Backend требует Node 26; frontend image Node 24 | README; package/Dockerfiles | Broken onboarding |
| Screenshots/GIF/demo docs существуют | Paths отсутствуют | README links + file check | Dead portfolio docs |
| `frontend/.env.example` можно копировать | Есть только `.env.production.example` | README/file list | Setup failure |
| Pricing/intake tests — engineering proof | `pricing.test.js`/`intake.test.js` пусты; `intake.validation.test.js` отсутствует | tests/README | False assurance |
| Retention fields не реализованы | Migration 013 добавляет fields/indexes, services есть | DPIA/data-map vs migration 013 | Compliance docs stale |
| Backup runbook готов | Все provider/frequency/RPO/RTO/drill — TODO | backup runbook | No recoverability |
| Docketwise sync | README честно говорит stub; UI/DB status говорит synced | service/README | Operational false success |
| Audit/event «email sent» | Delivery только stub | email service | False compliance evidence |

## 15. Production readiness score

| Раздел | 0–5 | Обоснование |
| --- | ---: | --- |
| Architecture | 3 | Уместный modular monolith, но boundaries/god modules |
| Backend | 3 | Широкая реализация и tests; critical bootstrap/integration gaps |
| Frontend | 3 | Build/lint/routes/forms; state/privacy/E2E gaps |
| Data | 2 | Migrations/FK/transactions есть; privacy atomicity/idempotency gaps |
| Security | 1 | Хорошие controls, но P0 + MFA/TLS/dependency blockers |
| Reliability | 1 | No durable jobs/backups; unsafe retry/PDF saturation |
| Testing | 2 | 299+12 green, но core empty/mocked/no E2E |
| Infrastructure | 2 | Working Compose/images, not hardened/HA |
| CI/CD | 2 | Solid checks skeleton, currently red/incomplete/no deploy |
| Observability | 1 | Logs/health only |
| Documentation | 2 | Много security/compliance docs, существенный drift/TODO |
| Maintainability | 2 | Layers and policies, но very large modules/duplication |
| Scalability | 2 | Stateless-ish API, но local files/single DB/in-memory controls |
| Developer Experience | 2 | Lock/scripts/Compose, но version/env/root inconsistencies |
| **Среднее** | **2.0** | Частично работающий beta/MVP, не production |

## 16. Top-10 findings

1. SEC-001 — первый public user становится admin.
2. DATA-001 — DSAR deletion оставляет PII, но ставит completed.
3. FUNC-001 — ключевые case-review fields теряются.
4. SEC-002/CI-001 — high dependency advisory и красный CI audit.
5. INT-001 — email reset/verification stub с ложным sent audit.
6. INT-002 — Docketwise stub ставит synced.
7. TEST-001 — core pricing/intake tests пусты.
8. OPS-001/OPS-002 — нет реального backup/restore и TLS.
9. API-001 — intake не идемпотентен.
10. SEC-007/OBS-001 — staff без MFA, production detection/alerts отсутствуют.

## 17. Рекомендуемые следующие действия

Немедленно исправить SEC-001 и не использовать систему с реальной PII до закрытия P0. Затем: core real-DB tests → field contract → complete DSAR deletion → idempotency → dependency/CI green. После этого подключить честные email/CRM semantics, staff MFA, TLS/encryption/backups, retention scheduler, observability и bounded PDF workload. Полный dependency-aware порядок: [ROADMAP_P0_P4.md](./ROADMAP_P0_P4.md).

## 18. Не удалось проверить

- Remote GitHub branch protection, current Actions status, CodeQL/ZAP reports, secret scanning settings.
- Реальный email/PSP/Docketwise — providers не подключены.
- Production hosting, TLS termination, DB/volume encryption, backups and restore.
- Main browser→real DB→staff→PDF scenario без изменения существующей БД; не выполнялся, чтобы не создавать пользовательские данные.
- PDF generation в freshly built backend against isolated DB/Chromium; image build подтверждён, live stack health — отдельно.
- Legal/privacy/licensing/accessibility conformance и attorney/counsel sign-off.
- Load/capacity/failover and disaster recovery.
