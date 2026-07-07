# Command ledger

Все команды выполнялись 2026-07-06. Секретные значения и `.env` не читались/не публикуются. Основной cwd, если не указан иначе: `/home/arina/projects/Affordable-immigration-service`. `apply_patch` использован только для восьми файлов `docs/audit/`.

## 1. Получение задания

**Команда:** `sed -n '1,240p' …/pasted-text.txt`; затем ranges `241,520` и `521,880`.  
**Причина:** прочитать приложенное ТЗ полностью.  
**Рабочая директория:** repository root; attachment вне repo read-only.  
**Exit code:** 0 / 0 / 0.  
**Ключевой вывод:** требуются read-only audit и восемь Markdown reports.  
**Созданные или изменённые файлы:** нет.

## 2. Repository inventory

| Команда | Причина | Exit | Ключевой вывод | Изменения |
| --- | --- | ---: | --- | --- |
| `git status --short --branch` | Зафиксировать исходный dirty state | 0 | `main`, много user changes/untracked; audit dir отсутствовал | Нет |
| `rg --files … \| sort` | Полный file inventory без deps/build | 0 | React frontend, Express backend, 14 migrations, tests/docs/CI | Нет |
| `find . -maxdepth 3 -type d …` | Directory topology | 0 | node_modules/dist/uploads присутствуют локально | Нет |
| `find . -maxdepth 3 -type f (README/Docker/package/lock/env/workflows)` | Entrypoints/config | 0 | Root/backend/frontend locks, Compose, 3 workflows | Нет |
| `sed -n '1,620p' README.md` + CHANGELOG/DEMO reads | Проверить claims/setup | 0 | README содержит dead links/version drift | Нет |
| Node script reading 3 `package.json` | Dependencies/scripts/engines | 0 | Backend Node 26; frontend React/Vite; root Puppeteer only | Нет |
| `sed` Compose/Dockerfiles/Nginx configs | Deployment/security | 0 | 4 containers, HTTP-only, backend non-root | Нет |
| `for f in .github/workflows/*.yml; sed …` | CI/CD inventory | 0 | CI/CodeQL/ZAP; ZAP warn-only; frontend tests omitted | Нет |
| `wc -l …` / import `rg` | Size/layering | 0 | 24,478 LOC selected; DSAR 938, LeadDetail 839 | Нет |
| `find docs …` + existence checks | Documentation claims | 0 | screenshots/demo docs/test/env link targets missing | Нет |

## 3. Architecture/API/source inspection

Следующие read-only commands завершились code 0 и не меняли файлы:

| Команда (сокращено без изменения смысла) | Причина | Ключевой вывод |
| --- | --- | --- |
| `sed backend/src/{server,app}.js` + config env/security/cors | Runtime/middleware/config | Startup migrations/admin seed; auth/RBAC route boundaries; prod secret validation |
| `rg router.(get/post/put/patch/delete)` + `sed` всех route files | Endpoint/RBAC inventory | Public/auth/account/admin API; unversioned, no OpenAPI |
| `sed frontend/src/App.jsx` + contexts + `services/api.js` | UI/API integration | Protected routes, in-memory access token, refresh cookie, large handwritten client |
| `rg fetch/localStorage/dangerouslySetInnerHTML/TODO/stub` | Security/stubs/debt | Intake PII localStorage; sanitized HTML; email/Docketwise stubs |
| `rg CREATE TABLE/INDEX/FK/CHECK` + migration `sed` | Data model/constraints | 14 versioned migrations, FK/check/indexes, retention fields |
| `sed` auth/session/token/user/transaction files | Authentication/data consistency | Refresh rotation robust; first-user admin; bootstrap optional |
| `sed` intake/repositories/access/domain policies | Core request flow/IDOR | 5-row intake transaction; owner/staff policies; no idempotency |
| `sed` upload/storage/scan middleware | File security | Size/MIME/magic/path controls; scan default off |
| `sed` document/PDF/encryption/services/templates | Document security | Escaping/sanitizer; Chromium JS/network off, `--no-sandbox`; DB HTML plaintext |
| `sed` password/email services | Recovery/integration | Provider is stub; sent audit is optimistic |
| `sed` payment/Docketwise services | External integrations | Hosted URL manual; Docketwise marks DB synced without API |
| `sed` DSAR service/repositories/anonymization | Privacy workflow | Child PII not erased; multi-write operations nontransactional |
| `sed` retention services/repositories/docs | Data lifecycle | Code exists; no scheduler; docs stale |
| `rg OpenAPI/metrics/queue/cache/cron` | Missing platform features | No spec, metrics/tracing, durable queue/worker/scheduler |
| `rg pricing/case fields` + form/schema reads | Contract parity | Location/relationship/deadline stripped and not persisted |
| `rg puppeteer` + `npm explain …` | Dependency use/paths | Frontend/root Puppeteer unused; backend needed for PDF |
| `rg danger/eval/window.open` + sanitizer reads | XSS/browser review | Only sanitized document injection; no eval |
| `rg pagination/status calls` | API semantics | Fixed limits/no cursor; mostly consistent response schemas/statuses |

Дополнительные точечные команды: `node --check backend/src/services/dsar.service.js` (0); all backend JS `node --check` through `find|xargs` (0); one mistaken path `nl backend/src/services/pdf.service.js` from `backend/` returned code 0 for shell batch but printed “No such file”, затем correct `nl src/services/pdf.service.js` code 0. Ошибка не скрыта.

## 4. Environment/dependency inventory

| Команда | Cwd | Exit | Ключевой вывод | Изменения |
| --- | --- | ---: | --- | --- |
| `node --version; npm --version; docker --version; docker compose version` | root | 0 | Node 26.2.0, npm 11.13.0, Docker 29.6.1, Compose 5.1.4 | Нет |
| Read lockfileVersion + env **key names only** | root | 0 | Все locks v3; production env gaps найдены; values не выводились | Нет |
| `npm ls --depth=0` | backend | 0 | Installed backend versions resolved | Нет |
| `npm ls --depth=0` | frontend | 0 | Installed frontend versions resolved | Нет |
| `npm ls --depth=0` | root | 0 | Только Puppeteer 25.1.0 | Нет |
| `du -sh …; git ls-files dist/node_modules/uploads` | root | 0 | deps/build ignored/untracked | Нет |
| LICENSE/SBOM search + git commit/branch | root | 0 | LICENSE/SBOM absent; audit base commit recorded | Нет |
| High-confidence secret prefix filename scan; scanner presence | root | 0 | No current-tree match; Gitleaks/TruffleHog absent | Нет |

## 5. Tests, lint, syntax, build

| Команда | Cwd | Exit | Ключевой вывод | Изменения |
| --- | --- | ---: | --- | --- |
| `npm test` | backend, sandbox | 1 | 41/52 file entries; 11 API files fail because `listen EPERM 127.0.0.1` | Нет |
| One API test via node test runner | backend, sandbox | 1 | Same top-level failure | Нет |
| Direct `node … tests/api/auth.api.test.js` | backend, sandbox | 1 | Detailed 13 failures all `listen EPERM`; 1 local assertion pass | Нет |
| `npm test` (approved localhost bind) | backend | 0 | **299 tests passed, 0 failed** | Temp/test runtime only |
| `npm test` | frontend | 0 | **12 passed** | Нет |
| `npm run lint` | frontend | 0 | ESLint green | Нет |
| `npm run build` | frontend | 0 | Vite build green; JS 450.70 kB, gzip 122.03 kB | **Regenerated ignored `frontend/dist/`** |
| `find backend/src … node --check` | root | 0 | All backend JS syntax valid | Нет |
| `docker compose config --quiet` | root | 0 | Compose syntax/interpolation valid in current environment | Нет |
| `git diff --check -- . ':!docs/audit/**'` | root | 0 | No whitespace errors in pre-existing tracked diff | Нет |

`backend` не имеет lint/typecheck/build script; frontend не использует TypeScript. Empty `backend/tests/intake.test.js` и `pricing.test.js` подтверждены `wc -c` (0/0), `sha256sum` и test search.

## 6. Runtime/migrations

| Команда | Cwd | Exit | Ключевой вывод | Изменения |
| --- | --- | ---: | --- | --- |
| `npm run migrate:check` | backend | 1 | Без local env: `DATABASE_URL` undefined; config fail-fast | Нет |
| `docker compose ps --all` sandbox | root | 1 | Docker socket permission denied | Нет |
| `docker image inspect …` sandbox | root | 1 | Docker socket permission denied | Нет |
| `docker compose ps --all` approved | root | 0 | Existing postgres/backend/frontend/nginx up; backend/Postgres healthy | Нет |
| `curl … http://127.0.0.1/api/health` approved | root | 0 | `{ok:true}` | Нет |
| `curl … http://127.0.0.1/api/ready` approved | root | 0 | DB ready; 14 expected/applied; 0 pending/mismatch | Нет |
| `.dockerignore` reads | root | 0 | env/node_modules/dist/uploads excluded appropriately | Нет |

Main user flow не отправлялся в existing DB, чтобы не создавать/изменять user records. Container logs также не читались, чтобы не раскрывать PII.

## 7. Dependency/security scans

| Команда | Cwd | Exit | Ключевой вывод | Изменения |
| --- | --- | ---: | --- | --- |
| `npm audit --offline --audit-level=high` | backend | 0 | Cached/offline result 0; позже опровергнут clean/online scan | Нет |
| `npm audit --omit=dev --audit-level=high` online | backend | 1 | 7 vulnerabilities: 5 moderate, 2 high | Нет |
| `npm audit --audit-level=high` online | frontend | 1 | 7: 1 low, 2 moderate, 4 high | Нет |
| `npm audit --omit=dev --audit-level=high` online | frontend | 1 | 4 production: 1 moderate, 3 high | Нет |
| `npm explain ws/multer/qs/ip-address` | package dirs | 0 | Direct/transitive paths identified | Нет |

## 8. Docker builds

| Команда | Cwd | Exit/result | Ключевой вывод | Изменения |
| --- | --- | --- | --- | --- |
| `docker build -t affordable-immigration-audit-backend:local .` | backend | Build completed; tag later found by inspect | Clean npm install reported 7 vulnerabilities; image exists; backend Config.User=`node` | Docker cache + audit image only |
| `docker build --build-arg VITE_API_URL=/api -t affordable-immigration-audit-frontend:local .` | frontend | 0 | Image built/tagged; Vite build green; install reports 7 vulnerabilities | Docker cache + audit image only |
| `docker image inspect … --format RepoTags/Id/User` | root | 1 | Backend line confirmed tag/id/user; template failed on frontend absent User key | Нет |
| Final metadata inspect | root | Terminated after no output | Docker/approval wait exceeded audit value; no conclusion added | Нет |

Запущенные application containers не пересоздавались и volumes не удалялись. Audit images не запускались поверх existing stack.

## 9. Report generation

**Команда:** `mkdir -p docs/audit` (exit 0), затем `apply_patch` для каждого требуемого Markdown.  
**Причина:** создать только разрешённые итоговые артефакты.  
**Рабочая директория:** repository root.  
**Ключевой вывод:** создано 8 reports.  
**Созданные или изменённые файлы:** `docs/audit/PROJECT_AUDIT.md`, `ARCHITECTURE_AS_IS.md`, `ARCHITECTURE_TARGET.md`, `FINDINGS.md`, `IMPLEMENTATION_MATRIX.md`, `SECURITY_REVIEW.md`, `COMMAND_LEDGER.md`, `ROADMAP_P0_P4.md`.

## 10. Финальная валидация отчётов

**Команда:** `find docs/audit …; wc -l docs/audit/*.md`; `rg` priority/ID/Mermaid/link checks; `git status --short`; `git diff --check`; затем shell assertions для 8 non-empty files, 33 unique IDs и priority counts.  
**Причина:** проверить полноту, внутреннюю согласованность и scope изменений.  
**Рабочая директория:** repository root.  
**Exit code:** 0 для всех validation batches.  
**Ключевой вывод:** 8 файлов, 1,243 строки до последнего ledger append; 33 unique finding IDs; roadmap counts `1,15,12,4,1`; repo-visible новая область — `docs/audit/`, остальные status entries существовали до аудита.  
**Созданные или изменённые файлы:** только обновлён `docs/audit/COMMAND_LEDGER.md`.

Последний read-only smoke check (`git status --short -- docs/audit`, zero-size search и проверка восьми H1) завершился code 0: пустых reports нет, единственная новая repo-visible область — `docs/audit/`.
