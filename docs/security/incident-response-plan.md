# Incident Response Plan

Practical security incident handling for Affordable Immigration Service.

**TODO:** Confirm breach notification obligations and timelines with legal/privacy counsel for applicable jurisdictions.

## Severity levels

| Level | Description | Examples | Initial response time |
|-------|-------------|----------|------------------------|
| **SEV-1** | Active exploitation, data exfiltration, or production down | Leaked DB credentials in use; mass unauthorized DSAR export | Immediate (< 15 min) |
| **SEV-2** | Confirmed vulnerability or limited unauthorized access | Single compromised admin session; exposed backup without evidence of download | < 1 hour |
| **SEV-3** | Suspected issue or contained misconfiguration | Dependency CVE with no known exploit in our stack; failed login spike | < 4 hours |
| **SEV-4** | Low-risk finding from scan or audit | ZAP informational finding; non-production secret in old branch | Next business day |

## Roles and contacts

| Role | Responsibility | Contact |
|------|----------------|---------|
| Incident commander | Coordinates response, comms, timeline | TODO: name / on-call |
| Engineering lead | Containment, patching, restore | TODO |
| Security / privacy lead | DSAR, notification review | TODO |
| Legal counsel | Breach notification, regulatory | TODO |
| Executive sponsor | Customer comms approval | TODO |

## Phases

### 1. Preparation

- Maintain [backup-restore-runbook.md](./backup-restore-runbook.md).
- Enable audit logging; review `audit_events` retention (365 days default).
- Keep secrets in platform secret manager, not git.
- Run CodeQL and dependency audit in CI.
- Document subprocessors in `docs/compliance/`.

### 2. Detection and analysis

Sources:

- Application logs (Pino / container logs)
- `audit_events` and `admin_audit_log`
- GitHub Dependabot / CodeQL alerts
- User or staff reports
- Infrastructure monitoring (TODO: confirm provider)

Preserve evidence:

- Export relevant audit rows (with legal hold if needed)
- Save log excerpts with timestamps and request IDs
- Do not destroy volumes or DB until counsel/engineering agree

### 3. Containment

Short-term actions as applicable:

- Revoke compromised user sessions (`auth_refresh_tokens` revocation; force password reset)
- Rotate leaked secrets (`AUTH_TOKEN_SECRET`, DB password, `DOCUMENT_ENCRYPTION_KEY_BASE64`, admin passwords)
- Disable compromised admin accounts
- Block abusive IP at reverse proxy (TODO: provider steps)
- Take affected service offline or enable maintenance mode

### 4. Eradication

- Patch vulnerable dependency or code path
- Remove malicious files from uploads
- Close exposed endpoints or misconfigured buckets
- Re-image or redeploy from known-good artifact

### 5. Recovery

- Follow [backup-restore-runbook.md](./backup-restore-runbook.md)
- Verify smoke tests before restoring traffic
- Monitor audit logs for recurrence

### 6. Post-incident review

Within 5 business days (SEV-1/2) or next sprint (SEV-3/4):

- Timeline of detection → containment → recovery
- Root cause
- What worked / what did not
- Action items with owners and due dates

## Playbooks

### Suspected account / session compromise

1. Identify user ID and session rows in `auth_refresh_tokens`.
2. Revoke all refresh tokens for user; clear sessions via logout-all (if implemented) or DB revoke.
3. Force password reset; verify email ownership.
4. Review `audit_events` for downloads, DSAR actions, admin changes.
5. Notify user if unauthorized access confirmed (TODO: counsel review).

### Leaked secret / API key

1. Classify secret (auth, DB, encryption, third-party).
2. Rotate immediately in secret manager and redeploy.
3. Invalidate old JWTs if `AUTH_TOKEN_SECRET` rotated (all users re-login).
4. Review git history; enable push protection if not already ([secret-scanning.md](./secret-scanning.md)).
5. Scan audit logs for use of compromised credentials.

### Exposed document / upload

1. Identify path or URL; remove public access.
2. Determine if file contained PII (DSAR export, intake screenshot in image upload).
3. If DSAR PDF: check `export_pdf_path` and access audit events.
4. Restore from backup if tampered; re-encrypt if encryption key potentially exposed.

### Payment / card data accidentally submitted

Application policy: do not store PAN/CVV. If submitted in intake notes:

1. Redact from DB if present (`paymentRedaction` patterns).
2. Purge from logs if logged (should be redacted by policy).
3. Notify counsel if card data was persisted or transmitted insecurely.

### DSAR / privacy data leak

1. Identify affected request IDs and data categories.
2. Legal hold on related records if investigation ongoing.
3. Preserve audit trail of export/download events.
4. **TODO:** Counsel review for notification to regulators and data subjects.

### Malicious admin / attorney access

1. Disable account; revoke tokens.
2. Review admin audit log for lead access, DSAR exports, retention jobs.
3. Assess scope of viewed or exported PII.
4. Escalate to SEV-1 if bulk export detected.

### Dependency vulnerability

1. Triage CVE severity and exploitability in our usage.
2. Upgrade dependency; run full test suite.
3. Deploy patch; monitor CodeQL / Dependabot for closure.

## Customer notification

Do not commit to notification timelines without legal/privacy counsel. Document:

- What data was involved
- Approximate number of individuals
- Remediation taken
- Contact channel for questions

## Postmortem template

```markdown
# Incident postmortem — [TITLE]

**Date:** YYYY-MM-DD
**Severity:** SEV-
**Incident commander:**

## Summary

## Timeline (UTC)

## Impact

## Root cause

## What went well

## What went poorly

## Action items

| Action | Owner | Due |
|--------|-------|-----|
```

## Related documents

- [backup-restore-runbook.md](./backup-restore-runbook.md)
- [security-hardening-checklist.md](./security-hardening-checklist.md)
- [secret-scanning.md](./secret-scanning.md)
