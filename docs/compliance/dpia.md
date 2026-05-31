# Data Protection Impact Assessment (DPIA)

## 1. Document control

| Field | Value |
|---|---|
| **Project** | Affordable-immigration-service |
| **Version** | 0.1 (draft) |
| **Date** | 2026-05-31 |
| **Owner** | Engineering / operations (internal) |
| **Reviewer** | TODO — privacy counsel |
| **Status** | Draft — internal working document |

> **TODO:** Have DPIA and data map reviewed by privacy counsel before production launch.  
> **TODO:** Confirm final lawful bases, retention periods, vendor processors, and processing locations.

**Related documents:**

- [Data map](./data-map.md)
- [Vendor / subprocessor matrix](./vendor-subprocessor-matrix.md)
- Public Privacy Policy: `frontend/src/pages/PrivacyPage.jsx` (draft; attorney review TODO)

---

## 2. Summary

### What the service does

Affordable-immigration-service is an immigration law firm intake and operations platform. It provides:

- A public marketing site and guided multi-step intake funnel
- User registration and authentication
- PostgreSQL-backed persistence for leads, intakes, generated agreements/onboarding packets, bookings, and payments
- Admin and attorney workflows for lead review, document approval, payment follow-up, and DSAR handling
- PDF generation for agreements and onboarding packets (Puppeteer + Chromium)
- Image uploads for site branding/media (local filesystem)
- A Docketwise sync **stub** (no live API integration yet)

Stack: Node.js/Express backend, React/Vite frontend, PostgreSQL, Docker Compose deployment.

### Why personal data is processed

Personal data is processed to:

- Operate user accounts and authenticate sessions
- Collect and review immigration intake inquiries
- Generate engagement and onboarding documents
- Coordinate consultations and manual/hosted-link payment workflows
- Support admin/attorney case review and firm operations
- Meet privacy rights (DSAR), security, and accountability obligations

### Main risk areas

1. **Immigration and intake data** — may include sensitive case facts in free-text fields (`intakes.notes`, generated HTML documents); potential special-category data under GDPR Article 9.
2. **Document access** — agreements and onboarding packets contain personal and case information; PDF download requires attorney approval workflow.
3. **Staff access** — admins and attorneys can read lead/intake/document data; misuse or over-access is a key risk.
4. **Retention gaps** — automated retention cleanup exists for technical/audit tables only; case/lead retention periods are not yet codified in schema (`retention_until` not implemented).
5. **Vendor/location unknowns** — production hosting, database region, email, and payment PSP are not confirmed in repo.
6. **Upload surface** — local image uploads with MIME/magic-byte validation; optional ClamAV; no client document upload table in DB yet (uploads are primarily admin branding images).

### Current mitigation summary

| Area | Implemented controls |
|---|---|
| Authentication | scrypt password hashing; JWT access tokens (15 min); HttpOnly refresh cookies (`__Host-` in production); refresh token hashing in DB |
| Authorization | Role checks (`admin`, `attorney`, `user`); staff-only admin routes; attorney approval required for packet PDF download |
| Input validation | Zod schemas (`backend/src/schemas/`) |
| Security headers | Helmet + CSP in production; CORS config; rate limiting; request ID + HTTP logging |
| Audit | `audit_events` table with metadata redaction (`auditRedaction.js`); `admin_audit_log` for admin mutations; document view/download/PDF audit |
| DSAR | Full request lifecycle (`dsar_requests`, events, export, correction, anonymization, restriction, legal hold) |
| Payment safety | No card storage; hosted payment URL only; Luhn/CVV/expiry detection in notes; admin note redaction |
| Retention (partial) | 90-day technical logs (cookie consent rows, expired refresh tokens); 365-day security audit purge (`retention-cleanup.service.js`) |
| Cookie consent | Opt-in defaults for analytics/marketing; consent logged server-side with hashed IP/UA; analytics loader is no-op |
| Uploads | Path traversal protection; allowed image MIME/extensions; optional virus scan |

---

## 3. Scope

### In scope

- Backend API (`backend/src/`) and PostgreSQL schema (`backend/src/db/migrations/`)
- Frontend intake, account, admin, and legal pages (`frontend/src/`)
- Authentication, sessions, and refresh tokens
- Lead/intake/onboarding/agreement/booking/payment workflows
- DSAR and privacy request handling
- Audit logging and retention cleanup for audit/technical tables
- Cookie consent logging
- Image uploads (local storage driver)
- PDF/document generation (in-process Chromium)
- Docketwise sync stub metadata
- Docker Compose deployment topology (development reference)

### Out of scope

- Production hosting provider contracts and regions (not in repo)
- Live Docketwise API integration (stub only)
- Production email delivery (stub only)
- Analytics/marketing third-party scripts (not loaded; consent UI exists)
- End-user document upload pipeline for case evidence (not found as DB-backed feature; uploads are image-only for site media)
- Firm email/phone systems outside this application
- Physical office records

### Systems/components

| Component | Path / artifact |
|---|---|
| Express API | `backend/src/app.js`, routes, controllers, services |
| PostgreSQL | Migrations `001`–`009`; tables: `users`, `leads`, `intakes`, `agreements`, `onboarding_packets`, `bookings`, `payments`, `docketwise_sync`, `auth_refresh_tokens`, `email_verification_tokens`, `password_reset_tokens`, `dsar_requests`, `dsar_request_events`, `audit_events`, `admin_audit_log`, `cookie_consent_logs`, `site_settings` |
| Frontend | React/Vite SPA |
| Reverse proxy | `deploy/nginx.conf`, `nginx:stable-alpine` in Compose |
| Upload storage | `backend/src/services/upload-storage.service.js`; Docker volume `uploads_data` |
| PDF generation | `backend/src/services/pdf.service.js`; Puppeteer + Chromium |
| Retention job | `backend/src/scripts/purge-retention.js` |

### Data subjects

| Subject group | Description |
|---|---|
| Registered users / clients | Users with `users.role = 'user'` who submit intake linked to their account |
| Prospective clients | Lead contact data submitted via intake (may or may not have account) |
| Firm staff | Admins and attorneys (`admin`, `attorney` roles) |
| Site visitors | Anonymous cookie consent records (`anonymous_id`) |
| DSAR requesters | Users exercising privacy rights |

---

## 4. Processing overview

### Collection points

| Point | Data collected | Code reference |
|---|---|---|
| Registration / login | email, full_name, password | `auth.service.js`, `users` table |
| Intake funnel | name, email, phone, case_type, notes, package, billing, payment preference, consent | `intake.schema.js`, `intakes`, `leads`, `payments`, `bookings` |
| Agreement/onboarding generation | HTML documents derived from intake | `agreements`, `onboarding_packets` |
| Admin operations | payment status, hosted payment URL, admin notes, lead state, document approval | admin controllers/services |
| DSAR portal | request type, identity verification, admin notes, export payload | `dsar_requests`, `dsar_request_events` |
| Cookie banner | consent categories, anonymous_id, hashed IP/UA | `cookie_consent_logs`, `cookieConsent.js` |
| Admin image upload | image files (logo, marketing) | upload routes, local filesystem |
| Docketwise sync (stub) | sync status, external_id placeholder | `docketwise_sync` |

### Storage systems

| Store | Contents | Location |
|---|---|---|
| PostgreSQL | Primary application data | Development: Docker volume `pgdata`. **Production: TODO confirm provider/region** |
| Local filesystem (`/app/uploads`) | Uploaded images | Same host as backend container; Docker volume `uploads_data` |
| Browser localStorage | Cookie consent preferences | End-user device |
| HttpOnly cookie | Refresh token (not raw token in DB) | End-user browser |
| Container stdout | Pino application logs | Hosting provider log sink; rotation TODO at infra layer |
| In-memory (transient) | PDF buffers during generation | Backend process; not persisted as files by default |

### Internal access

| Role | Access |
|---|---|
| `user` | Own account, own leads/documents |
| `attorney` | Staff access to leads, documents, DSAR (with policy checks) |
| `admin` | Full admin API including users, payments, audit, DSAR admin, uploads |
| Unauthenticated | Public intake, cookie consent, public image serving, health endpoints |

Access enforced via `requireAuth`, `adminOnly`, `assertAttorneyAccess`, and lead ownership checks in services.

### External processors/subprocessors

See [vendor-subprocessor-matrix.md](./vendor-subprocessor-matrix.md). Summary:

- **Confirmed in repo (dev):** PostgreSQL, Docker, NGINX, local file storage, Chromium (PDF), optional ClamAV
- **Not configured:** production hosting, email provider, payment PSP, analytics
- **Planned/stub:** Docketwise

### Transfers

- Application code does not define production regions.
- Privacy Policy (draft) states data may be processed in the US and other provider locations.
- **TODO:** Complete EU transfer review in vendor matrix before processing EEA data in production.

### Retention/deletion

| Category | Policy (as implemented) | Mechanism |
|---|---|---|
| Cookie consent logs | 90 days (default) | `deleteCookieConsentLogsOlderThan` |
| Expired refresh tokens | Purged on cleanup run | `deleteExpiredAuthRefreshTokens` |
| `audit_events`, `admin_audit_log` | 365 days (default) | `deleteAuditEventsOlderThan`, `deleteAdminAuditLogsOlderThan` |
| DSAR records | Retained while request active; **legal_hold** blocks destructive actions | `dsar_requests.legal_hold` |
| Leads, intakes, documents, payments | **No automated retention_until** | Soft delete on leads (`deleted_at`); DSAR anonymization for linked user data |
| Uploaded images | No automated purge in code | Manual / DSAR / infra lifecycle TODO |

Env vars: `TECHNICAL_LOG_RETENTION_DAYS`, `SECURITY_AUDIT_RETENTION_DAYS` (`backend/.env.example`).

---

## 5. Necessity and proportionality

| Question | Assessment |
|---|---|
| Is each data category necessary? | Core intake fields are required by Zod schemas for service delivery. Free-text `notes` is optional but may contain sensitive over-collection — **TODO:** counsel review of field necessity. |
| Can any field be removed or made optional? | `intakes.notes` is optional. Billing fields required at final intake step. **TODO:** review whether all intake fields are proportionate pre-engagement. |
| Is data used only for stated purposes? | Code paths align with intake, document generation, admin workflow, payment coordination, DSAR, and security. Docketwise stub stores sync metadata only. |
| Is retention limited? | Partially — audit/cookie consent retention automated; case data retention periods **TODO confirm with counsel**. |
| Are users informed via Privacy Policy? | Yes — draft `PrivacyPage.jsx` covers categories, purposes, rights, retention overview. **TODO:** attorney/counsel review before launch. |
| Are DSAR rights supported? | Yes — export, correction, deletion, anonymization, restriction, legal hold (`dsar.service.js`). |
| Are processors documented? | Internal vendor matrix exists; public subprocessor list marked TODO in Privacy Policy. |
| Consent for core service? | Manual payment processing consent checkbox at intake (`consentManualProcessing`). Cookie analytics/marketing default off until opt-in. |

### Special category data (Article 9)

Immigration intake may indirectly reveal ethnic origin, health, or other special categories via `case_type`, `notes`, and generated documents. **Lawful condition under Article 9: TODO confirm with privacy counsel** (may require explicit consent or other Article 9 basis depending on jurisdiction and matter type).

---

## 6. Data map summary

Full processing inventory: **[data-map.md](./data-map.md)**

### High-risk data categories

| Category | Why high risk |
|---|---|
| Immigration intake & notes | Sensitive case facts; potential Article 9 data |
| Generated agreements / onboarding HTML | Aggregates PII and case details; staff-reviewed |
| Payment admin notes | Free-text; mitigated by card-data rejection/redaction |
| DSAR export payloads | Comprehensive personal data export (`export_payload_json`) |
| Auth tokens (hashed) | Credential compromise risk |

---

## 7. Risk assessment

| Risk ID | Processing Area | Risk | Data Subjects Affected | Likelihood | Impact | Initial Risk | Mitigation | Residual Risk | Owner | Status/TODO |
|---|---|---|---|---|---|---|---|---|---|---|
| R1 | Immigration/intake | Unauthorized access to intake, notes, or generated documents | Clients, prospective clients | Medium | High | **High** | RBAC; auth middleware; lead ownership checks; staff-only admin routes; document access audit (`documentAudit.js`); attorney approval before PDF download | Medium | Engineering | Implemented; periodic access review TODO |
| R2 | Intake/onboarding | Overcollection of sensitive immigration/personal data in free-text fields | Clients | Medium | High | **High** | Zod validation; optional `notes`; Privacy Policy disclosure; **TODO:** field minimization review with counsel | Medium–High | Product / counsel | Partial — counsel review TODO |
| R3 | Retention | Excessive retention of case/lead data beyond purpose | All clients | Medium | Medium | **Medium** | DSAR anonymization/deletion; legal hold on DSAR; audit retention cleanup; **TODO:** `retention_until` for case records | Medium | Engineering / counsel | Planned — case retention TODO |
| R4 | Uploads | Path traversal, malicious upload, or insecure file exposure | Firm, visitors | Low–Medium | High | **Medium** | `assertSafeUploadFilename`; MIME + magic-byte validation; image-only; optional ClamAV; served via controlled API routes | Low–Medium | Engineering | Implemented; production scanner TODO |
| R5 | Auth/sessions | Refresh/access token theft or session fixation | Users, staff | Medium | High | **High** | HttpOnly `__Host-` refresh cookie in prod; token hashing in DB; scrypt passwords; rate limiting; short-lived access tokens | Medium | Engineering | Implemented |
| R6 | Payments | Card data accidentally entered into payment/admin notes | Clients | Medium | High | **High** | Reject card-like data on intake (`assertNoPaymentCardData`); admin redaction (`paymentRedaction.js`); hosted checkout only; no PAN storage | Low–Medium | Engineering | Implemented |
| R7 | DSAR | Incomplete or delayed DSAR handling | Data subjects | Low–Medium | High | **Medium** | DSAR module with identity verification, export, correction, anonymization, restriction, legal hold; admin workflow | Low–Medium | Ops / counsel | Implemented; SLA/procedures TODO |
| R8 | Vendors/transfers | EU personal data transferred without adequate safeguards | EEA subjects | Unknown | High | **Unknown** | Vendor matrix; Privacy Policy transfer section; **TODO:** confirm regions, DPAs, SCCs/DPF | Unknown | Counsel / ops | TODO before EEA production |
| R9 | Staff access | Admin/attorney misuse or unnecessary access to sensitive leads | Clients | Low–Medium | High | **Medium** | Role separation; audit logging for admin mutations and sensitive reads; least-privilege by role | Medium | Firm / engineering | Implemented; access policy TODO |
| R10 | Audit logs | Sensitive payloads logged in audit metadata or HTTP logs | Clients | Low–Medium | High | **Medium** | `sanitizeAuditMetadata`; intake audit logs field names only; Pino structured logging policy | Low–Medium | Engineering | Implemented; log review TODO |
| R11 | Cookies/analytics | Analytics/marketing loaded before consent | Visitors | Low | Medium | **Low** | Consent defaults false; `loadAnalytics()`/`loadMarketing()` no-op; server-side consent log | Low | Engineering | OK — revisit if analytics added |
| R12 | Legal hold | Legal hold conflicts with deletion/anonymization | DSAR requesters | Low | Medium | **Low–Medium** | `assertNoLegalHold` blocks destructive DSAR actions; legal hold events audited | Low | Ops / counsel | Implemented |

**Likelihood / impact scale:** Low, Medium, High (qualitative, internal).

---

## 8. Measures and controls

### Technical controls

| Control | Implementation |
|---|---|
| Authentication | JWT + refresh token rotation; scrypt password hashing (`backend/src/utils/auth.js`) |
| Session cookies | HttpOnly, Secure (prod), SameSite=Lax, `__Host-` prefix (`authCookies.js`) |
| Authorization | `user.policy.js`; admin-only routes; attorney staff access |
| Validation | Zod schemas for intake, DSAR, cookie consent, payments |
| HTTP security | Helmet, CSP (production), CORS, rate limit, 1 MB JSON limit |
| Audit trail | `audit_events`, `admin_audit_log`, document access audit |
| Metadata redaction | `auditRedaction.js`, `paymentRedaction.js` |
| DSAR tooling | Export, anonymization, restriction, legal hold |
| Retention automation | `purge-retention.js` / `retention-cleanup.service.js` |
| Upload hardening | Filename sanitization, path containment, MIME/magic-byte checks |
| Payment URL validation | HTTPS-only hosted links; optional host allowlist (`hostedPaymentUrl.js`) |
| DB SSL | Configurable `DB_SSL`, `DB_SSL_REJECT_UNAUTHORIZED` |

### Organisational controls

| Control | Status |
|---|---|
| Privacy Policy and legal pages (draft) | `PrivacyPage.jsx` — **TODO attorney review** |
| Internal vendor/subprocessor matrix | `vendor-subprocessor-matrix.md` |
| DSAR operational procedures | **TODO** document response SLAs and identity verification process |
| Staff access policy for admin/attorney roles | **TODO** |
| Incident response / breach notification | **TODO** |

### Legal/compliance controls

| Control | Status |
|---|---|
| Lawful basis documentation | Data map + Privacy Policy table — **TODO counsel confirmation** |
| Article 9 assessment for immigration data | **TODO counsel** |
| DPAs with processors | **TODO** per vendor matrix |
| Records of processing (Article 30) | This data map (draft) |

### Vendor/subprocessor controls

- Maintain and review [vendor-subprocessor-matrix.md](./vendor-subprocessor-matrix.md)
- Confirm DPA/SCC/DPF before production launch
- Re-assess when enabling email, payment PSP, Docketwise API, cloud storage, or analytics

---

## 9. Residual risk

After current mitigations:

| Area | Residual risk | Acceptable? |
|---|---|---|
| Immigration data sensitivity | Medium–High — inherent to service purpose | **TODO** — requires counsel and firm risk acceptance |
| Production vendor/transfer unknowns | Unknown | **No** — must resolve before EEA/high-risk production |
| Case data retention not time-bound in DB | Medium | **TODO** — implement retention policy fields or documented schedules |
| Docketwise live integration | Unknown (future) | **TODO** when integrated |
| Email provider not configured | Low (stub) | OK for dev; **TODO** before production auth emails |

### TODOs requiring legal/security sign-off

- [ ] Privacy counsel review of this DPIA and data map
- [ ] Confirm lawful bases (especially Article 9 for immigration fields)
- [ ] Confirm production hosting, database, and backup regions
- [ ] Confirm payment PSP and email vendor DPAs
- [ ] Define and implement case/lead retention periods (`retention_until` / legal hold strategy)
- [ ] Accept or further mitigate residual high-risk processing
- [ ] Public subprocessor list publication (after vendor confirmation)

---

## 10. Review cadence

### Review trigger events

- Production launch or material infrastructure change (hosting, DB, storage, email, payment, Docketwise go-live)
- New data categories or intake fields
- New third-party analytics/marketing tools
- Security incident or DSAR trend affecting controls
- Change to retention constants or DSAR/legal hold behavior
- Regulatory or bar ethics guidance update

### Next scheduled review

| Review | Target date | Owner |
|---|---|---|
| Initial counsel review | Before production launch | TODO |
| Annual DPIA refresh | TODO — 12 months after launch | Engineering / counsel |

---

## Appendix: Evidence index

| Topic | Primary sources |
|---|---|
| Schema | `backend/src/db/migrations/*.sql` |
| Retention | `backend/src/constants/retention.js`, `retention-cleanup.service.js` |
| DSAR | `backend/src/services/dsar.service.js`, `006_dsar.sql` |
| Audit | `backend/src/services/audit.service.js`, `009_audit_events.sql` |
| Auth | `003_auth_tokens.sql`, `auth.service.js`, `authCookies.js` |
| Intake | `backend/src/schemas/intake.schema.js`, `001_initial_schema.sql` |
| Payments | `008_payment_hosted_link.sql`, `paymentRedaction.js` |
| Cookie consent | `007_cookie_consent_logs.sql`, `frontend/src/lib/cookieConsent.js` |
| Deploy | `docker-compose.yml`, `deploy/nginx.conf` |
