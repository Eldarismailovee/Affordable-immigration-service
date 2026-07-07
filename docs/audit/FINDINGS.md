# Реестр findings

Дата среза: 2026-07-06. Проверен текущий рабочий каталог, включая незакоммиченные изменения. Приоритет — порядок исправления; severity — техническое влияние. Confidence: High означает прямое подтверждение кодом или командой, Medium — вывод зависит от production-окружения либо эксплуатации.

## Сводка

| Приоритет | Количество |
| --- | ---: |
| P0 | 1 |
| P1 | 15 |
| P2 | 12 |
| P3 | 4 |
| P4 | 1 |
| **Всего** | **33** |

## P0

### SEC-001 — Публичный первый пользователь получает роль администратора

- **Severity / confidence:** Critical / High.
- **Component:** bootstrap authentication/RBAC.
- **Evidence:** `backend/src/services/auth.service.js:34-35,62` назначает `admin`, если `countUsers() === 0`; `backend/src/config/env.js:107-113` допускает пустые `ADMIN_EMAIL`/`ADMIN_PASSWORD`; `backend/src/bootstrap/seedInitialAdmin.js:7-9` тогда ничего не создаёт. Поведение закреплено тестом `backend/tests/services/auth.service.test.js:148`.
- **Reproduction:** запустить production с пустой БД без bootstrap-admin и вызвать `POST /api/auth/register`; ответная сессия относится к пользователю с `role=admin`. Два параллельных первых запроса также имеют race между `COUNT` и `INSERT`.
- **Impact:** удалённое получение полного доступа к лидам, документам, DSAR, пользователям, оплатам, uploads и audit events.
- **Recommendation:** регистрация всегда создаёт только `user`; bootstrap admin — отдельная одноразовая транзакционная команда/инвайт с обязательным production-secret. Startup должен fail-fast, пока безопасный администратор не provisioned либо регистрация выключена.
- **Verification criteria:** публичный register никогда не возвращает staff-role; concurrency-тест двух регистраций; production startup/registration безопасно обрабатывает отсутствие admin; миграционный тест на пустой БД.

## P1

### SEC-002 — Runtime-зависимости содержат актуальные high-severity advisory

- **Severity / confidence:** High / High.
- **Component:** backend и frontend supply chain.
- **Evidence:** `npm audit --omit=dev --audit-level=high` завершился code 1. Backend: 7 (5 moderate, 2 high), включая Multer DoS (`GHSA-72gw-mp4g-v24j`, `GHSA-3p4h-7m6x-2hcm`) и `ws` disclosure/DoS (`GHSA-58qx-3vcg-4xpx`, `GHSA-96hv-2xvq-fx4p`). Frontend production tree: 4 (1 moderate, 3 high), включая React Router advisories и `ws`. Чистые Docker builds показывают те же totals.
- **Reproduction:** выполнить online `npm audit --omit=dev --audit-level=high` в `backend/` и `frontend/`.
- **Impact:** доступные DoS/upload-abort атаки; часть frontend advisory может быть неприменима к SPA mode, но это не доказано. Текущий CI audit gate красный.
- **Recommendation:** обновить lock-файлы после анализа breaking changes; удалить неиспользуемый `puppeteer-core` из frontend/root; отдельно проверить exploitability React Router SPA; повторить API/upload/load tests.
- **Verification criteria:** production audit code 0, документированный triage исключений, clean Docker build без high findings.

### SEC-006 — Шифрование sensitive data at rest не гарантировано

- **Severity / confidence:** High / High.
- **Component:** PostgreSQL, uploads, DSAR files.
- **Evidence:** Compose использует обычные named volumes (`docker-compose.yml:10-11,62-64`); provider encryption не определён. `DOCUMENT_ENCRYPTION_KEY_BASE64` optional (`backend/src/config/env.js:192-195`), а AES-GCM применяется только к DSAR PDF (`backend/src/services/dsar-pdf-export.service.js`), не к HTML agreements/onboarding и intake/payment PII в PostgreSQL. `docs/security/security-hardening-checklist.md` оставляет production encryption unchecked.
- **Reproduction:** запустить без encryption key; `writeSensitiveDocumentFile` пишет plaintext, что прямо покрыто тестом `backend/tests/services/document-storage.service.test.js:57`.
- **Impact:** кража volume/snapshot раскрывает immigration PII, billing contacts и документы.
- **Recommendation:** обязательное encrypted storage/managed DB encryption, secret-manager key, backup encryption и rotation runbook; fail-fast для sensitive file storage в production.
- **Verification criteria:** инфраструктурное подтверждение encryption at rest, encrypted backups, restore drill, negative startup test без обязательного key/config.

### SEC-007 — Staff authentication не имеет MFA и усиленной защиты sensitive actions

- **Severity / confidence:** High / High.
- **Component:** admin/attorney accounts.
- **Evidence:** auth schema и services реализуют только email/password + JWT/refresh (`backend/src/schemas/auth.schema.js`, `backend/src/services/auth.service.js`, `backend/src/services/session.service.js`); MFA, re-auth для exports/role changes и logout-all endpoint не найдены.
- **Reproduction:** войти одной парой credentials и выполнить DSAR export, смену роли либо документный download без второго фактора/step-up.
- **Impact:** одна украденная staff-сессия даёт широкий доступ к legal PII.
- **Recommendation:** MFA/WebAuthn/TOTP для staff, step-up на DSAR/export/role changes, session inventory и revoke-all.
- **Verification criteria:** staff login требует MFA; sensitive endpoints проверяют recent assurance; security/API tests покрывают bypass.

### DATA-001 — DSAR anonymization неполна, неатомарна и помечает запрос completed

- **Severity / confidence:** High / High.
- **Component:** privacy deletion.
- **Evidence:** `backend/src/services/dsar-anonymization.service.js:5-9` меняет только leads, user и refresh tokens без транзакции. `anonymizeLeadsForUserId` очищает лишь contact fields (`lead.repository.js:440-455`), но не `intakes.notes`, payment billing/notes, booking, agreement/onboarding HTML, export JSON/PDF. Затем `dsar.service.js:597-603` отдельно ставит DSAR `completed`.
- **Reproduction:** создать lead с intake/payment/generated document, выполнить deletion DSAR, затем запросить соответствующие таблицы: дочерняя PII остаётся; искусственный сбой после первого UPDATE оставляет partial state.
- **Impact:** ложное исполнение права на удаление, остаточная sensitive PII и неустранимо неоднозначный audit trail.
- **Recommendation:** формализовать deletion inventory/исключения, выполнить весь DB-scope в одной транзакции с row locks; файлы обрабатывать через durable job с compensating state; completed только после verified post-condition.
- **Verification criteria:** integration test с реальным PostgreSQL проверяет все PII columns/files, rollback на каждом fault point и legal-hold exceptions.

### FUNC-001 — Данные case review теряются между UI и backend

- **Severity / confidence:** High / High.
- **Component:** основной intake flow.
- **Evidence:** `CaseReviewPage.jsx:67-74` сохраняет relationship/location/deadline в context; `IntakeContext.jsx:12-15` содержит поля; `BookingStepPage.jsx:88-92` отправляет весь object. Но `finalIntakeSchema` (`backend/src/schemas/intake.schema.js:23-35`) полей не содержит, Zod их strip-ит; таблицы/insert их не сохраняют. `intake.service.js:109` читает `payload.jurisdiction`, которого schema не пропускает.
- **Reproduction:** заполнить case review, отправить intake и проверить persisted intake/conflict check: relationship/location/deadline отсутствуют.
- **Impact:** staff не получает заявленные данные, jurisdiction check фактически выполняется с `undefined`, urgent cases теряются.
- **Recommendation:** единый контракт полей; миграция DB; explicit strict schema; mapping `location -> jurisdiction`; UI review перед submit.
- **Verification criteria:** end-to-end test browser→API→PostgreSQL подтверждает все поля и jurisdiction decision.

### INT-001 — Email delivery является stub, но события записываются как successful/sent

- **Severity / confidence:** High / High.
- **Component:** verification, password reset, marketing/transactional email.
- **Evidence:** `backend/src/services/email.service.js:17-30` только возвращает `Email service stub`; при этом `EMAIL_TRANSACTIONAL_SENT` пишется с success (`:52-66`). Production provider/env отсутствует. Reset/verification token возвращается в JSON только не-production, поэтому production user его не получит.
- **Reproduction:** production password reset request возвращает generic success, но никакого сетевого delivery не происходит.
- **Impact:** account recovery и verification неработоспособны; audit создаёт ложное доказательство отправки.
- **Recommendation:** provider adapter, delivery IDs, timeout/retry/bounce handling; статусы queued/sent/delivered/failed; startup readiness для обязательной интеграции.
- **Verification criteria:** sandbox-provider integration test и receipt; failure записывается failed, не sent; reset flow проходит без debug token.

### INT-002 — Docketwise stub помечает лид как реально synced

- **Severity / confidence:** High / High.
- **Component:** CRM handoff.
- **Evidence:** `backend/src/services/docketwise-admin.service.js:32-69` генерирует локальный `DW-*`, ставит `synced` и отвечает «marked as synced», не вызывая vendor API. README признаёт stub, но admin UI использует тот же статус.
- **Reproduction:** вызвать `POST /api/admin/docketwise/:leadId/sync`; PostgreSQL получает `synced`, а внешнего запроса нет.
- **Impact:** operations может считать matter переданным, хотя данные никуда не отправлены.
- **Recommendation:** до интеграции использовать статус `simulated/not_connected`; затем outbox job, vendor idempotency, response validation, retries и failed state.
- **Verification criteria:** stub не способен выставить production `synced`; contract test с vendor sandbox подтверждает external ID.

### TEST-001 — Файлы критических pricing/intake тестов пусты

- **Severity / confidence:** High / High.
- **Component:** core business tests.
- **Evidence:** `backend/tests/intake.test.js` и `backend/tests/pricing.test.js` имеют 0 bytes; `sha256` обоих — hash пустого файла. `rg` не нашёл вызовов `calculatePricing` в tests. Node runner тем не менее показывает эти файлы как passed entries. README утверждает наличие pricing/intake validation tests и ссылается ещё на отсутствующий `backend/tests/intake.validation.test.js`.
- **Reproduction:** `wc -c backend/tests/{intake,pricing}.test.js` → 0; `npm test` всё равно green.
- **Impact:** денежная логика и успешный intake persistence не защищены от регрессий; test count создаёт ложную уверенность.
- **Recommendation:** table-driven pricing tests, schema boundary tests, real-DB happy path/fault injection/idempotency tests; запрет empty tests в CI.
- **Verification criteria:** mutation of each price branch ломает тест; core happy path проверяет пять связанных rows и rollback.

### CI-001 — Текущий CI должен падать на обоих dependency audit jobs

- **Severity / confidence:** High / High.
- **Component:** `.github/workflows/ci.yml`.
- **Evidence:** workflow выполняет `npm audit --audit-level=high` (`ci.yml` backend/frontend jobs); локально online команды завершились code 1 с high advisory.
- **Reproduction:** запустить те же команды на текущих lock-файлах.
- **Impact:** main/PR pipeline не green либо audit gate обходится вручную; Docker job не запускается из-за `needs`.
- **Recommendation:** устранить/triage зависимости, затем подтвердить состояние GitHub checks и branch protection.
- **Verification criteria:** CI на чистом commit полностью green, required checks включены.

### OPS-001 — Backup/restore существует только как TODO-runbook

- **Severity / confidence:** High / High.
- **Component:** PostgreSQL и named volumes.
- **Evidence:** `docs/security/backup-restore-runbook.md` содержит TODO provider/frequency/RPO/RTO и restore drill; Compose не содержит backup service/export; uploads и DSAR files на локальных volumes.
- **Reproduction:** по repo невозможно выполнить provider-specific backup/restore или предъявить успешный drill.
- **Impact:** single-host/volume failure может привести к невосстановимой потере legal records.
- **Recommendation:** автоматические encrypted backups DB+files, согласованный snapshot boundary, retention/monitoring и регулярный restore drill.
- **Verification criteria:** зафиксированные RPO/RTO, успешный restore в isolated staging, checksum/core-flow verification.

### OPS-002 — As-is deployment публикует только HTTP

- **Severity / confidence:** High / High.
- **Component:** edge Nginx/Compose.
- **Evidence:** `docker-compose.yml:88-89` публикует `80:80`; `deploy/nginx.conf` слушает 80, TLS/HSTS на edge оставлены TODO. README относит HTTPS к будущим шагам.
- **Reproduction:** текущий `curl http://127.0.0.1/api/health` работает по plaintext; TLS listener/config отсутствует.
- **Impact:** deployment «как есть» передаёт credentials/cookies/PII без транспортной защиты.
- **Recommendation:** обязательный TLS на trusted LB/edge, redirect 80→443, корректные forwarded headers, HSTS после проверки домена.
- **Verification criteria:** TLS scan, HTTP redirect, secure cookie E2E, direct backend недоступен.

### OPS-003 — Retention jobs не имеют расписания

- **Severity / confidence:** High / High.
- **Component:** data lifecycle.
- **Evidence:** есть CLI/admin trigger (`package.json`, `runRetentionJobs.js`, admin routes), но worker/cron/scheduler в Compose/CI/deployment не найден. Документация содержит противоречивые старые TODO.
- **Reproduction:** оставить due record; без ручного HTTP/CLI запуска он не обрабатывается.
- **Impact:** PII и auth/audit rows хранятся дольше заявленного срока.
- **Recommendation:** durable scheduled job с singleton lock, dry-run/report, alerts и legal-hold tests.
- **Verification criteria:** scheduler evidence, overdue metric/alert, integration run с due/not-due/hold records.

### OBS-001 — Нет production metrics, tracing, error tracking, alerts и SLO

- **Severity / confidence:** Medium / High.
- **Component:** observability.
- **Evidence:** есть Pino/request ID и health/readiness, но поиск не нашёл OpenTelemetry/Prometheus/Sentry; Compose не содержит collector/monitoring; incident contacts/infra monitoring — TODO.
- **Reproduction:** repository не позволяет построить latency/error/DB/PDF/retention dashboards или alert rules.
- **Impact:** security/reliability regressions и failed jobs обнаруживаются поздно; SLO не измеряется.
- **Recommendation:** RED metrics, DB pool/slow query, PDF queue, auth anomaly, retention overdue, centralized logs/error tracking и базовые alerts/SLO.
- **Verification criteria:** dashboards, alert test, trace/request correlation, documented SLI.

### API-001 — Критические mutation endpoints не идемпотентны

- **Severity / confidence:** High / High.
- **Component:** intake, DSAR, manual sync/actions.
- **Evidence:** idempotency key/store не найдены. Каждый `POST /api/account/intake` генерирует новые UUID (`intake.service.js:29-35`) и создаёт новый lead; DB не имеет business-key для повторной submission.
- **Reproduction:** отправить один payload дважды после client timeout — две группы lead/intake/booking/payment/sync.
- **Impact:** дубли лидов, консультаций и payment operations; retry небезопасен.
- **Recommendation:** scoped idempotency keys + request hash + stored response, UI single-flight и duplicate review tooling.
- **Verification criteria:** concurrent/retry tests возвращают один resource/result; key reuse с другим payload отклоняется.

### REL-001 — PDF pipeline имеет неограниченную очередь и browser без sandbox

- **Severity / confidence:** High / High.
- **Component:** PDF generation.
- **Evidence:** `asyncLimiter.js` хранит unbounded process-memory queue; `pdf.service.js:7,14-23` запускает новый Chromium по одному и с `--no-sandbox`, без per-task timeout. Compose не задаёт memory/CPU limits.
- **Reproduction:** авторизованно инициировать много PDF downloads; requests накапливаются, каждый launch тяжёлый.
- **Impact:** memory exhaustion/DoS; browser exploit имеет меньшую изоляцию.
- **Recommendation:** bounded queue, 429/503 backpressure, job timeout/cancellation, reusable hardened browser/worker, container seccomp/resources; убрать `--no-sandbox`, если runtime допускает.
- **Verification criteria:** load test доказывает bounded memory/latency, timeout и recovery; container security test.

## P2

| ID | Severity / confidence | Component | Evidence и reproduction | Impact | Recommendation | Verification criteria |
| --- | --- | --- | --- | --- | --- | --- |
| DATA-002 | High / High | transaction + audit | `recordAuditEvent` ловит любую DB error (`audit.service.js:42-77`). В `payment.service.js:45-78` и `user.service.js:56-75` он вызывается внутри transaction client. SQL error переводит PostgreSQL transaction в aborted; catch скрывает ошибку, а `COMMIT` фактически rollback, результат UPDATE уже возвращён сервису. Воспроизвести fault injection на audit INSERT. | API может вернуть success с объектом, которого в БД нет; вне транзакций security audit теряется fail-open. | В transaction mode rethrow; либо transactional outbox. Проверять command tag COMMIT; явная политика fail-open/fail-closed. | Real-DB fault test: audit failure откатывает mutation и даёт non-2xx; outbox/event появляется атомарно. |
| DATA-003 | Medium / High | DSAR/auth concurrency | Correction/restriction/status/identity и password reset consume→password→revoke состоят из отдельных writes без UoW/row lock (`dsar.service.js`, `password-reset.service.js:48-60`). | Partial state, lost update, token consumed без password change. | Транзакции, `SELECT … FOR UPDATE`, compare-and-set status/version. | Fault/concurrency tests на каждом transition. |
| SEC-003 | High / High | browser storage | `IntakeContext.jsx:34-45` сохраняет name/email/phone/case notes/billing/deadline в `localStorage` без TTL; reset только после явного вызова. | Любой same-origin XSS/extension/shared-device user читает immigration PII; данные переживают logout. | Не хранить sensitive draft либо encrypted/session-scoped storage с TTL; очищать logout/success; CSP остаётся defense-in-depth. | Browser test подтверждает отсутствие PII после logout/success/TTL. |
| SEC-004 | Medium / High | hosted payment URL | `PAYMENT_HOST_ALLOWLIST` default empty в env/Compose; production env example ключ не перечисляет. `parseHostedPaymentUrl` тогда принимает любой HTTPS host. | Ошибка/скомпрометированный admin размещает phishing link. | В production allowlist обязателен; provider-specific parser и confirmation UI. | Startup fails без allowlist; negative tests unknown/subdomain/punycode hosts. |
| SEC-005 | Medium / High | uploads | Scanner default false; local public UUID files не имеют metadata ownership/expiry; no cleanup job. Magic-byte/MIME/size/path controls есть. | Polyglot/malware и orphan/public-by-URL data; storage exhaustion. | Production malware/CDR policy, object storage, lifecycle, quotas, delete/reference tracking. | Malicious/aborted upload tests, lifecycle and quota tests. |
| API-002 | Medium / High | `/api/account/booking` | Route не валидирует body; `booking.service.js` только echo-ит payload и возвращает 201, ничего не записывая. Frontend route не использует. | Ложный API contract и phantom booking для будущего client. | Удалить endpoint либо реализовать schema+persistence+ownership/idempotency. | API test проверяет DB row либо 410/404 после удаления. |
| API-003 | Medium / High | API governance | `/api` без versioning/OpenAPI; admin leads жёстко `LIMIT 100`, users без limit, DSAR `LIMIT 500`; pagination links/cursors отсутствуют. | Непредсказуемая совместимость и невидимые records при росте. | OpenAPI из общих schemas, `/api/v1`/compat policy, cursor pagination/filter/sort. | Contract tests и pagination boundary tests. |
| ARCH-001 | Medium / High | modular monolith boundaries | `dsar.service.js` 938 LOC, `LeadDetailPage.jsx` 839, retention repository 581; `utils/leadDocument.js` и `utils/documentAudit.js` зависят от services, repositories зависят от utils. | Слабая cohesion, сложный fault testing и изменения privacy workflow. | Разделить по use cases; ports/adapters только там, где полезно; запрет обратных imports. | Dependency rule + меньшие cohesive modules, без behavior regression. |
| TEST-002 | High / High | test strategy | 299 backend tests green, но API использует in-memory repos/module mocks; CI Postgres применяется только после tests. Frontend 12 tests в основном regex/readFile и не рендерят UI; E2E/load/security/migration-upgrade tests отсутствуют. | SQL mapping, transactions, browser flow и runtime integration не проверены. | Testcontainers/CI Postgres integration, Playwright core flow, upload/PDF/security/load suites. | Реальный DB+browser happy path green и ловит намеренные SQL/UI regressions. |
| CI-002 | Medium / High | CI/CD | Frontend job не запускает `npm test`; нет backend lint/typecheck, secret/image/license/SBOM scan, artifact provenance/deploy/rollback. DAST job целиком `continue-on-error: true`. | Regressions и supply-chain risks не блокируют release; release process невоспроизводим. | Добавить missing gates, artifacts/images by digest, staged deploy/rollback; DAST triage threshold. | Required checks и release evidence на commit SHA. |
| OPS-005 | Medium / High | Compose/containers | Backend Docker health проверяет `/health`, не DB `/ready`; Nginx/frontend не имеют healthcheck; frontend runtime не задаёт `USER`; floating image tags; нет read-only fs/cap drop/resource limits. | Orchestrator считает backend healthy при недоступной DB; blast radius/неповторяемость выше. | Разделить liveness/readiness, pin digests, non-root Nginx, limits/security options. | Container tests и failure injection DB-down. |
| DOC-001 | Medium / High | documentation | README: Node 20+ против backend `>=26 <27`; отсутствуют screenshots/demo path/`docs/DEMO.md`/frontend `.env.example`/`intake.validation.test.js`; changelog не отражает DSAR/security changes. DPIA/data-map утверждают, что retention fields не реализованы, хотя migration 013 существует. | Ошибочный onboarding и compliance evidence. | Docs-as-code link/command checks, актуализировать claims и generated inventory. | CI markdown link/command test; reviewer подтверждает code-doc parity. |

## P3

| ID | Severity / confidence | Component | Evidence и reproduction | Impact | Recommendation | Verification criteria |
| --- | --- | --- | --- | --- | --- | --- |
| ARCH-002 | Low / High | dependency/domain duplication | Pricing реализован отдельно в backend `pricingCalculator.js` и frontend `usePricingCalculator.js`; jurisdiction/constants тоже зеркалируются. `puppeteer-core` установлен в root 25.1 и frontend 24.40 без import; backend использует 24.40. | Drift, bundle/install surface, лишние advisory. | Удалить unused deps; публиковать/version shared contract или получать quote только с API. | Один authoritative pricing contract; dependency graph без unused Puppeteer. |
| DX-001 | Low / High | tooling/onboarding | Backend Node 26, frontend Docker Node 24, README 20+; frontend `.env.example` отсутствует; root package не имеет scripts/name. | Невоспроизводимый local DX. | Единая toolchain policy (`.nvmrc`/Volta), root workspace scripts, корректные env examples. | Clean-machine setup по README. |
| DOC-002 | Low / High | licensing | LICENSE/SBOM/license field/automated license inventory не найдены; README говорит private/portfolio. | Неясные права распространения и transitive license risk. | Явная project license/private notice и CI license inventory. | Counsel/owner-approved LICENSE policy + report. |
| QA-001 | Medium / High | accessibility | Accessibility tests преимущественно проверяют наличие строк; docs прямо говорят manual QA TODO; axe/browser/screen-reader/PDF conformance run не найден. | Нельзя заявлять WCAG conformance. | Automated axe + keyboard/screen-reader/manual matrix; PDF accessibility review. | Signed QA evidence по поддерживаемым browsers/AT. |

## P4

| ID | Severity / confidence | Component | Evidence и reproduction | Impact | Recommendation | Verification criteria |
| --- | --- | --- | --- | --- | --- | --- |
| SCALE-001 | Low / High | deployment topology | Один Compose host, один PostgreSQL, local volumes, no CDN/object storage/replicas/queue. | Single point of failure и предел horizontal scaling. | Не дробить на микросервисы; при подтверждённой нагрузке перейти на managed PostgreSQL/backups, object storage/CDN и stateless API/worker replicas. | Capacity/SLO justify change; failover and cost tests. |
