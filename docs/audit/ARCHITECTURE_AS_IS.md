# Архитектура as-is

## 1. Классификация

Проект — **слоистый модульный монолит** с отдельным SPA frontend и одной backend runtime. Это не microservices и не event-driven система: все business modules загружаются в один Node.js process, используют один PostgreSQL и прямые imports. Наличие `domain/services/repositories` даёт элементы clean/layered architecture, но обратные зависимости из `utils` в `services`, большие cross-domain services и прямой общий pool не соответствуют строгой Clean/Hexagonal architecture.

Фактическая стадия: **advanced MVP / beta**, локально исполнимый, но не staging/production-ready из-за SEC-001 и P1 blockers.

## 2. System Context

```mermaid
flowchart LR
  Visitor[Prospective client]
  Client[Registered client]
  Staff[Admin / operations]
  Attorney[Attorney]
  System[Immigration intake & legal-ops platform]
  PSP[Hosted payment provider\nmanual URL only]
  Email[Email provider\nNOT CONNECTED]
  Docketwise[Docketwise\nNOT CONNECTED]

  Visitor -->|marketing, case review, privacy request| System
  Client -->|auth, intake, documents, DSAR| System
  Staff -->|lead/payment/user/privacy operations| System
  Attorney -->|conflict/review/approval| System
  System -.->|browser follows admin-configured HTTPS URL| PSP
  System -.->|stub: no delivery| Email
  System -.->|stub: DB status only| Docketwise
```

Trust boundaries: Internet→Nginx; browser→Bearer API; refresh token→HttpOnly cookie; staff RBAC; backend→PostgreSQL/volumes; backend→Chromium subprocess. Email/Docketwise are declared boundaries, not implemented integrations.

## 3. Container diagram

```mermaid
flowchart TB
  Browser[Browser\nReact 19 SPA]
  Edge[Nginx reverse proxy\nHTTP :80]
  Frontend[Nginx static frontend]
  API[Node 26 / Express 4 API\none process]
  Chromium[Chromium subprocess\nPDF; JS/network disabled\n--no-sandbox]
  PG[(PostgreSQL 16\npgdata volume)]
  Uploads[(uploads_data\nlocal images)]
  Exports[(dsar_exports\noptional AES-GCM)]

  Browser --> Edge
  Edge -->|/| Frontend
  Edge -->|/api/*, /uploads/*| API
  API --> PG
  API --> Uploads
  API --> Exports
  API --> Chromium

  Missing[No cache • no queue • no worker • no CDN\nno object storage • no monitoring stack]
```

`docker-compose.yml` запускает ровно postgres/backend/frontend/nginx. Frontend и backend — разные images, но backend business domains не разнесены на services/processes.

## 4. Backend components

```mermaid
flowchart LR
  Routes[Express routes\npublic/auth/account/admin]
  MW[Middleware\nrequestId, Pino, Helmet, CORS, rate limit, auth/RBAC, Zod]
  Controllers[Thin controllers\nresponse schema/status]
  Services[Application services\nauth/intake/workflow/docs/payment/DSAR/retention]
  Domain[Domain policies/errors/validators]
  Repos[SQL repositories]
  DB[(pg Pool + migrations)]
  Templates[HTML templates]
  PDF[Puppeteer PDF]
  Files[Local file adapters]
  Stubs[Email + Docketwise stubs]
  Audit[Audit service\nbest-effort]

  Routes --> MW --> Controllers --> Services
  Services --> Domain
  Services --> Repos --> DB
  Services --> Templates
  Services --> PDF
  Services --> Files
  Services --> Stubs
  Services --> Audit --> Repos
```

Основные entrypoints: `backend/src/server.js`, `frontend/src/main.jsx`, Nginx `/api/` proxy. Migrations 001–014 выполняются backend startup с advisory lock и checksums.

### Модули и ответственность

| Модуль | Фактическая цепочка | Состояние |
| --- | --- | --- |
| Auth/session | routes → controllers → auth/session services → user/token repos | Реализовано; first-user privilege flaw |
| Intake/pricing | React context/forms → API → Zod → intake service → transaction 5 tables | Частично: часть pre-intake fields теряется |
| Lead workflow | admin UI/API → conflict/lead-state policies/repos | Реализовано, tests на mocks |
| Agreement/onboarding | templates → DB HTML → approval → Puppeteer PDF | Реализовано условно; approval required for PDF |
| Payments | manual status + hosted HTTPS link | Частично; PSP/webhook отсутствуют |
| Docketwise | local status mutation | Stub, несмотря на `synced` label |
| Email | token/template + audit | Stub, delivery отсутствует |
| DSAR | request/export/PDF/correction/restriction/deletion | Частично; deletion неполна/неатомарна |
| Retention | policies + repository + manual CLI/admin trigger | Реализовано частично; scheduler отсутствует |
| Uploads | admin image upload, MIME/magic bytes, local public serving | Реализовано условно; scanner default off |
| Observability | Pino/request ID/health/readiness/audit tables | Базово; metrics/tracing/alerts отсутствуют |

## 5. Deployment diagram

```mermaid
flowchart TB
  User[Client device]
  Host[Single Docker host]
  RP[Nginx container\nport 80]
  FE[Frontend Nginx container]
  BE[Backend Node container\nUSER node]
  DB[(Postgres container)]
  V1[(pgdata)]
  V2[(uploads_data)]
  V3[(dsar_exports)]

  User -->|HTTP as configured| RP
  subgraph Host
    RP --> FE
    RP --> BE
    BE --> DB
    DB --> V1
    BE --> V2
    BE --> V3
  end

  CDN[CDN / TLS LB]:::missing
  Mon[Monitoring]:::missing
  Obj[Object storage]:::missing
  classDef missing stroke-dasharray: 5 5,color:#777;
```

CDN/TLS LB/monitoring/object storage показаны как отсутствующие, а не как deployed. Текущий локальный runtime: четыре контейнера up; backend/PostgreSQL healthy; `/api/ready` подтвердил DB ready и 14/14 migrations.

## 6. Основной request flow: intake

```mermaid
sequenceDiagram
  actor C as Registered client
  participant R as React intake
  participant A as Express API
  participant Z as Auth + Zod
  participant S as Intake service
  participant P as PostgreSQL
  participant U as Audit service

  C->>R: Complete forms
  R->>A: POST /api/account/intake + Bearer
  A->>Z: Authenticate, rate-limit, validate
  Note over Z: Unknown fields are stripped
  Z->>S: createIntake(payload,user)
  S->>S: restriction + availability + server pricing
  S->>P: BEGIN
  S->>P: lead + intake + booking + payment + docketwise row
  S->>P: COMMIT
  S->>U: best-effort audit events
  S-->>A: leadId + pricing/summary
  A-->>R: 201
```

Agreement preview перед submit не сохраняется. Agreement/onboarding documents генерируются позже staff-потоком после state/conflict/attorney gates.

## 7. Staff workflow

```mermaid
flowchart LR
  New[Lead: new] --> Conflict[conflict_check]
  Conflict --> Review[attorney_review]
  Review --> Accepted[accepted]
  Accepted --> Engaged[engaged]
  Engaged --> Filed[filed]
  New --> Declined[declined]
  Conflict --> Declined
  Review --> Declined
  Accepted --> Declined

  Accepted --> Agreement[Generate draft agreement]
  Agreement --> ApproveA[Attorney approves]
  Engaged --> Packet[Generate onboarding packet]
  Packet --> ApproveP[Attorney approves]
  ApproveA --> Download[Client/staff PDF]
  ApproveP --> Download
```

State policies существуют (`lead-state.policy.js`, `lead-workflow.policy.js`, `packet.policy.js`), но concurrency control/version column отсутствует.

## 8. Async flow as-is

Durable async pipeline отсутствует. Реальные процессы:

```mermaid
flowchart LR
  HTTP[HTTP request] --> Sync[In-process synchronous service]
  Sync --> Commit[(DB commit)]
  Commit --> Response[HTTP response]
  Commit -.-> Finish[res.finish callback\nadmin audit, best effort]
  Manual[Admin HTTP or CLI] --> Retention[Retention job\nsynchronous]
  EmailCall[Auth action] -.-> Stub[Email stub\nno queue/retry/DLQ]
  DocketCall[Admin sync] -.-> DBOnly[Mark DB synced\nno external call/retry/DLQ]
```

Retry, dead-letter, job state и client result update не реализованы. Нельзя считать process-local Promise/background callback durable processing.

## 9. Data model

Главные aggregates/tables: users; refresh/verification/reset tokens; leads; intakes; conflict checks; agreements; onboarding packets; bookings; payments; docketwise sync; site settings; DSAR requests/events; cookie consent; audit events/admin audit; email suppressions. Foreign keys и основные check/index/unique constraints присутствуют; agreements/onboarding имеют unique lead index. Отдельного tenant ID нет: система single-firm, user ownership основан на `leads.user_id`; admin/attorney — глобальные staff roles.

## 10. Failure points и bottlenecks

- Single host/PostgreSQL/volumes — общий SPOF.
- PDF — single-concurrency, unbounded in-memory queue, новый Chromium на документ.
- Email/Docketwise дают false-positive operational state.
- DSAR multi-write flows могут остаться partial; deletion не покрывает child PII.
- Audit fail-open скрывает ошибки; внутри transaction это особенно опасно.
- Fixed `LIMIT 100/500` без pagination скрывает записи при росте.
- In-memory rate limit и queues не разделяются между replicas.
- Healthcheck backend смотрит liveness `/health`, а не DB readiness.

## 11. Архитектурные ограничения

Плюсы: thin controllers, server-side validation/pricing, parameterized SQL, ownership policies, migrations/checksums/advisory lock, refresh rotation, non-root backend, security headers, graceful shutdown, structured logging.

Ограничения: нет strict ports/adapters/DI container; services импортируют concrete repositories; cross-cutting audit inconsistent; большие modules; contracts продублированы с frontend; нет durable messaging. Для текущего масштаба монолит уместен — проблема не в отсутствии microservices, а в незакрытых trust/data boundaries.
