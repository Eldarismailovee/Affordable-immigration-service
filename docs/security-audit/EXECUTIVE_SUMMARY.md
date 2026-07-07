# Executive Security Summary — 6 July 2026

Verdict: **FAIL**

Проект нельзя выводить в staging с реальными PII или в production. Главная причина — подтверждённая публичная эскалация: первый зарегистрированный через `POST /api/auth/register` пользователь получает роль `admin`. Дополнительно DSAR deletion оставляет значительный объём PII, case-review данные молча теряются, а Docketwise/email/booking возвращают ложные успешные состояния.

## Результаты

| Severity | Количество |
|---|---:|
| Critical | 1 |
| High | 5 |
| Medium | 14 |
| Low | 1 |

| Статус finding | Количество |
|---|---:|
| CONFIRMED | 16 |
| HIGH_CONFIDENCE | 4 |
| SUSPECTED | 0 |
| FALSE_POSITIVE | 0 |
| NOT_VERIFIED | 1 |

Отдельно 8 dependency/scanner hypotheses классифицированы как `NOT_REACHABLE`, `MITIGATED` или dev-only и не включены в severity totals.

## Пять главных рисков

1. `AUTH-001` — публичный первый пользователь становится admin (Critical, P0).
2. `PRIV-001` — DSAR deletion ставит `completed`, оставляя PII в child tables, HTML/PDF и самой DSAR записи (High, P1).
3. `BUS-001` — relationship/location/deadline молча удаляются Zod и не сохраняются (High, P1).
4. `BUS-002` — Docketwise помечается `synced` без вызова provider API (High, P1).
5. `DEP-001` — достижимая Multer 2.1.1 DoS-уязвимость; особенно опасна в цепочке с `AUTH-001` (High, P1).

## Ответы для запуска

| Вопрос | Ответ |
|---|---|
| Безопасно запускать локально? | Только с синтетическими данными, не публикуя порт в недоверенную сеть. |
| Безопасно использовать тестовые данные? | Да, при изолированной локальной БД и без реальных email/payment providers. |
| Безопасно использовать реальные PII? | Нет. |
| Готов к staging? | Нет. |
| Готов к production? | Нет. |
| Privilege escalation? | Да, подтверждена. |
| IDOR? | Подтверждённого IDOR не найдено; ownership checks присутствуют. HTTP matrix выполнена не полностью. |
| Exposed secrets? | В tracked tree/history по проверенным сигнатурам не найдены; ignored `.env` содержит локальные значения и не раскрыт. |
| CISA KEV / reachable High CVE? | Найден достижимый High CVE в Multer; совпадений его CVE с CISA KEV 2026-07-01 нет. Версия Chromium image не проверена. |
| DSAR deletion работает полностью? | Нет. |
| Staff/admin защищены MFA? | Нет MFA. |
| Backup/restore? | Только незавершённый runbook; реальные backup и restore drill не подтверждены. |
| TLS? | Локальный Compose — HTTP; production TLS не подтверждён. |
| Security monitoring? | Audit logs есть; alerting/SIEM/tamper resistance не подтверждены. |

Первая remediation-задача: удалить implicit bootstrap из публичной регистрации и разрешать создание первого admin только через отдельный, одноразовый, транзакционный deployment/bootstrap процесс.
