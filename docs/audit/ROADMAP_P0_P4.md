# Roadmap P0–P4

Порядок ниже учитывает зависимости и не является календарной оценкой. Сложность: XS/S/M/L/XL. Один ID соответствует finding в `FINDINGS.md`.

## P0 — немедленно закрыть privilege escalation

| ID | Приоритет | Задача | Причина | Зависимости | Критерий готовности | Сложность |
| --- | --- | --- | --- | --- | --- | --- |
| SEC-001 | P0 | Удалить first-user-admin, сделать безопасный bootstrap/invite staff | Публичное получение полного admin access на пустой БД | Нет | Register всегда создаёт `user`; race tests; production bootstrap fail-safe; миграционный runbook | M |

## P1 — обязательные до staging с real data / production

| ID | Приоритет | Задача | Причина | Зависимости | Критерий готовности | Сложность |
| --- | --- | --- | --- | --- | --- | --- |
| TEST-001 | P1 | Реализовать реальные pricing/intake tests и запрет empty tests | Денежная и основная запись не тестируются | SEC-001 test fixtures | Table tests + real-DB happy/rollback path; empty-file gate | M |
| FUNC-001 | P1 | Провести case review fields через contract и DB | Location/relationship/deadline сейчас теряются | DB migration, TEST-001 | Browser→API→DB assertions; jurisdiction использует сохранённое поле | M |
| DATA-001 | P1 | Перепроектировать DSAR deletion как полную проверяемую workflow | PII остаётся после `completed` | Data inventory, legal retention decisions | Все PII stores/files покрыты; atomic DB phase; post-condition и fault tests | XL |
| API-001 | P1 | Добавить idempotency для intake и других create-команд | Retry создаёт duplicates | Schema/DB migration, TEST-001 | Concurrent retry создаёт один resource; hash mismatch rejected | L |
| SEC-002 | P1 | Обновить/удалить vulnerable runtime dependencies | High advisory и красный CI | Regression suites | Backend/frontend production audits code 0; documented exploitability triage | M |
| CI-001 | P1 | Вернуть CI в green и сделать checks required | Audit jobs сейчас воспроизводимо падают | SEC-002 | Чистый PR выполняет все jobs; branch rule подтверждён | S |
| INT-001 | P1 | Подключить production email adapter и честные delivery states | Reset/verification не доставляются, audit ложный | Secrets/provider choice, outbox design | Provider sandbox receipt; retry/failure/bounce; no debug token dependency | L |
| INT-002 | P1 | Не маркировать stub Docketwise как synced; затем durable integration | Ложная передача matters | API-001/outbox, vendor sandbox | `synced` только после vendor ACK; idempotent retry/failed state | L |
| SEC-007 | P1 | MFA/step-up/session control для staff | Один password/session открывает legal PII | Email/provider or WebAuthn, SEC-001 | MFA mandatory; recent-auth checks; revoke-all/session inventory | L |
| SEC-006 | P1 | Обязать encryption at rest и backup encryption | Sensitive data на неподтверждённых volumes | Hosting/provider, OPS-001 | Config/provider evidence; encrypted restore succeeds; key rotation documented | L |
| OPS-001 | P1 | Реализовать и испытать backup/restore | Сейчас только TODO-runbook | Provider/storage decision, SEC-006 | RPO/RTO утверждены; automated backups; isolated restore drill passed | L |
| OPS-002 | P1 | Ввести обязательный TLS edge | As-is публикуется HTTP | DNS/certificate/edge | 80→443; TLS scan; secure-cookie E2E; direct backend private | M |
| OPS-003 | P1 | Запланировать retention job и monitoring | Due PII не удаляется автоматически | DATA-001 policy, OBS-001 | Singleton schedule, legal-hold tests, overdue alert/report | M |
| OBS-001 | P1 | Базовые logs/metrics/error tracking/alerts/SLO | Production failures невидимы | Hosting/platform | RED/DB/PDF/retention/auth dashboards; test alert; runbook links | L |
| REL-001 | P1 | Ограничить и изолировать PDF workload | Unbounded queue + no-sandbox Chromium | Metrics/load harness | Bounded queue, timeout/backpressure, resource limits, load/security test | L |

## P2 — стабилизация architecture/data/API/operations

| ID | Приоритет | Задача | Причина | Зависимости | Критерий готовности | Сложность |
| --- | --- | --- | --- | --- | --- | --- |
| DATA-002 | P2 | Сделать audit atomic/outbox-aware и не скрывать transaction error | Возможен success после rollback и потеря audit | Transaction integration harness | Fault test даёт rollback+non-2xx либо atomic outbox | M |
| DATA-003 | P2 | Транзакции/locks/versioning для DSAR/auth transitions | Partial/lost updates | DATA-001, DB tests | Concurrent/fault tests для transitions и one-time tokens | L |
| SEC-003 | P2 | Убрать sensitive intake из persistent localStorage | PII переживает logout и доступна XSS/shared device | UX draft decision | No PII after logout/success/TTL; browser tests | M |
| SEC-004 | P2 | Сделать payment host allowlist обязательным | Любой HTTPS link разрешён по умолчанию | Provider decision | Production startup rejects empty list; IDN/subdomain tests | S |
| SEC-005 | P2 | Harden upload storage/scanning/lifecycle | Scanner off, orphan public files | Object-storage/provider or local policy | Scan/quota/expiry/delete/reference tests; malware fail closed | L |
| API-002 | P2 | Удалить или реализовать standalone booking endpoint | Сейчас 201 без persistence | API contract decision | Persistence+ownership+validation test либо endpoint отсутствует | S |
| API-003 | P2 | OpenAPI/version/compatibility + cursor pagination | Fixed caps и undocumented contracts | Stable schemas | Generated/validated spec; pagination boundary/compat tests | L |
| ARCH-001 | P2 | Разделить DSAR/retention/LeadDetail по use cases | God modules и обратные layer dependencies | Tests first | Dependency rules; cohesive modules; no behavior drift | L |
| TEST-002 | P2 | Добавить PostgreSQL integration и browser E2E suites | Mocks не проверяют SQL/DOM flow | TEST-001, stable env | Real DB + Playwright core/security/upload/PDF smoke in CI | XL |
| CI-002 | P2 | Дополнить CI/release gates | Frontend tests/scan/artifacts/deploy отсутствуют | CI-001, TEST-002 | Frontend tests, scans, SBOM, signed/pinned artifact, staged rollback evidence | L |
| OPS-005 | P2 | Harden Compose/images/probes | Readiness неверна, root/floating tags/no limits | REL-001, CI images | `/ready`, non-root, digest pins, limits/cap drop/read-only where possible | M |
| DOC-001 | P2 | Синхронизировать README/compliance/changelog | Документы противоречат коду и имеют dead links | FUNC/DATA decisions | Link/command checks green; privacy counsel markers актуальны | M |

## P3 — maintainability и DX

| ID | Приоритет | Задача | Причина | Зависимости | Критерий готовности | Сложность |
| --- | --- | --- | --- | --- | --- | --- |
| ARCH-002 | P3 | Убрать duplicate pricing/config/dependencies | Drift и лишний supply-chain surface | API-003 contract | Один authoritative quote; Puppeteer только backend | M |
| DX-001 | P3 | Унифицировать Node/toolchain/root scripts/env examples | README 20 vs Node 26/24 | CI toolchain | Clean-machine onboarding воспроизводим | S |
| DOC-002 | P3 | Зафиксировать license policy и inventory | Неясно распространение/лицензии | Owner/legal decision | LICENSE/private notice + CI report | S |
| QA-001 | P3 | Закрыть accessibility manual/axe evidence | Сейчас только static string checks/TODO | E2E harness | Axe + keyboard/AT matrix + PDF review signed | M |

## P4 — только после измеренной необходимости

| ID | Приоритет | Задача | Причина | Зависимости | Критерий готовности | Сложность |
| --- | --- | --- | --- | --- | --- | --- |
| SCALE-001 | P4 | Эволюция single-host modular monolith | Текущая topology имеет SPOF/scale ceiling | SLO/capacity data, P0–P2 | Managed HA DB/backups, object storage/CDN, stateless replicas и worker only when justified; failover/cost test | XL |

## Рекомендуемая последовательность

1. Закрыть SEC-001 и заморозить production launch.
2. Добавить core tests, исправить потерю полей и DSAR deletion; затем idempotency.
3. Устранить dependency advisory/CI failure.
4. Подключить реальные email/CRM semantics, MFA, encryption, backups и TLS.
5. Включить retention schedule, observability и bounded PDF processing.
6. После стабильных contracts расширить integration/E2E, API governance и refactor.
7. Масштабировать topology только по измеренным SLO/capacity, не переходя к микросервисам автоматически.
