# Backup / Restore Runbook

## Scope

- PostgreSQL database (leads, intakes, users, payments, audit, DSAR, cookie consent)
- Uploaded documents / storage (`backend/uploads/`, `backend/var/dsar-exports/`)
- Environment configuration / secrets references (not values in git)
- Legal / compliance documentation in repo (`docs/`)
- Audit logs (`audit_events`, `admin_audit_log`)

## Backup schedule

| Asset | Method | Frequency | Owner |
|-------|--------|-----------|-------|
| PostgreSQL | TODO confirm provider automated snapshots | TODO confirm (daily recommended) | Platform / DBA |
| Upload volume (`uploads_data`) | TODO confirm storage snapshot or rsync | TODO confirm | Platform |
| DSAR export directory (`var/dsar-exports`) | Same as app volume or separate snapshot | TODO confirm | Platform |
| Secrets (`AUTH_TOKEN_SECRET`, `DOCUMENT_ENCRYPTION_KEY_BASE64`, DB credentials) | Platform secret manager | On change | Security / platform |
| Application code | Git repository | Continuous | Engineering |

TODO: Confirm production database provider and backup frequency.

TODO: Confirm storage provider and snapshot/versioning for Docker volumes or cloud object storage.

## Restore objectives

| Metric | Target | Notes |
|--------|--------|-------|
| RPO (Recovery Point Objective) | TODO | Depends on snapshot frequency |
| RTO (Recovery Time Objective) | TODO | Depends on provider and team availability |

## Restore procedure

1. **Identify incident / restore point** — note incident ID, desired snapshot timestamp, and approver.
2. **Freeze writes if needed** — put app in maintenance mode or stop backend to prevent new data during restore.
3. **Restore DB snapshot to staging** — use provider console or CLI (TODO: add provider-specific commands).
4. **Validate schema / migrations** — run `npm run migrate:check` against restored DB.
5. **Restore document storage snapshot** — restore `uploads_data` volume and `var/dsar-exports` from same time window as DB when possible.
6. **Verify app boot and core flows** — health, ready, login, lead list.
7. **Run smoke tests** — see verification checklist below.
8. **Promote / restore production** — switch traffic or promote staging restore per provider runbook.
9. **Document timeline and approver** — record in incident ticket / postmortem.

## Restore verification

After restore, verify:

- [ ] Login (client and admin)
- [ ] Lead / intake view
- [ ] Document download (agreement, onboarding PDF)
- [ ] DSAR export download (if encryption key unchanged)
- [ ] Audit log access (admin)
- [ ] Payment metadata view (no card data stored)
- [ ] DSAR / privacy request workflow
- [ ] Public site and image uploads

## Backup testing cadence

TODO: Schedule monthly or quarterly restore drill to staging.

Record:

- Date of drill
- Snapshot used
- Time to restore
- Issues found
- Owner sign-off

## Rollback

If a restore causes regression:

1. Stop writes again.
2. Revert to previous known-good snapshot (DB + files from same point in time).
3. Re-run verification checklist.
4. Escalate per [incident-response-plan.md](./incident-response-plan.md).

TODO: Add provider-specific rollback steps once production host is confirmed.

## Related documents

- [document-encryption-at-rest.md](./document-encryption-at-rest.md)
- [incident-response-plan.md](./incident-response-plan.md)
- [security-hardening-checklist.md](./security-hardening-checklist.md)
