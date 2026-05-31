# Records of Processing / Data Map

**Project:** Affordable-immigration-service  
**Version:** 0.1 (draft)  
**Date:** 2026-05-31  
**Status:** Internal working document — not legal advice

> **TODO:** Have DPIA and data map reviewed by privacy counsel before production launch.  
> **TODO:** Confirm final lawful bases, retention periods, vendor processors, and processing locations.

**Related documents:**

- [DPIA](./dpia.md)
- [Vendor / subprocessor matrix](./vendor-subprocessor-matrix.md)

**Evidence:** PostgreSQL migrations (`backend/src/db/migrations/`), Zod schemas (`backend/src/schemas/`), services, `docker-compose.yml`, `backend/.env.example`.

---

## Processing inventory

| Data Category | Example Fields | Data Subjects | Purpose | Lawful Basis | Special Category? | Source | System/Table | Location | Processor/Subprocessor | Recipients | Retention | Deletion/Anonymization | Risk | Mitigation | Status/TODO |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Account / client profile** | `email`, `full_name`, `role` (`user`/`admin`/`attorney`), `status`, `email_verified_at`, `created_at`, `updated_at`, `deleted_at` | Registered users; firm staff | Account creation; authentication; role-based access; client communication; service delivery | **Contract** (registered users requesting services); **Legitimate interests** (firm operations for staff accounts) | No (profile itself) | User registration; admin user management | `users` | Dev: Docker PostgreSQL (`pgdata` volume). **Prod: TODO confirm region** | Self-hosted app + PostgreSQL ([matrix](./vendor-subprocessor-matrix.md)) | Firm staff (admin/attorney); user (own record) | While account active + reasonable period thereafter (Privacy Policy). No `retention_until` column. **TODO confirm period with counsel** | Soft delete via `deleted_at`; DSAR anonymization (`anonymizeUserById`); processing restriction fields | Medium — credential and identity data | scrypt password hashing; RBAC; auth middleware; DSAR export/correction/anonymization | TODO — retention period |
| **Account — processing restriction** | `processing_restricted_at`, `processing_restriction_reason` | Registered users | Honor DSAR restriction requests; limit processing while restricted | **Legal obligation** (GDPR Art. 18); **Legitimate interests** (compliance) | No | DSAR restriction workflow | `users` | Same as above | Self-hosted | Admin/attorney (operational) | Duration of restriction / until lifted | Cleared when restriction removed; user anonymization on DSAR | Low | DSAR module; audit events | Implemented |
| **Auth — password** | `password_hash` (scrypt) | Registered users; staff | Authentication | **Contract**; **Legitimate interests** (security) | No | Registration; password change | `users.password_hash` | Same as above | Self-hosted | None (not disclosed) | Life of account | Removed on user anonymization/deletion | High if exposed | scrypt hashing; never logged; excluded from audit metadata | Implemented |
| **Auth — refresh sessions** | `token_hash`, `user_agent`, `ip_address`, `expires_at`, `revoked_at`, `last_used_at` | Registered users; staff | Session continuity; security monitoring; token rotation | **Legitimate interests** (security, fraud prevention) | No | Login / refresh | `auth_refresh_tokens` | Same as above | Self-hosted | None | Until expiry (30 days default) or revocation; expired rows purged by retention job | Revoke on logout/password change; `deleteExpiredAuthRefreshTokens` | High — session hijack | HttpOnly refresh cookie (`__Host-` in prod); hash-only storage; rate limiting | Implemented |
| **Auth — email verification tokens** | `token_hash`, `expires_at`, `consumed_at` | Registered users | Verify email ownership | **Legitimate interests**; **Contract** (account integrity) | No | Registration (when verification enabled) | `email_verification_tokens` | Same as above | Self-hosted | None (token not sent — email stub) | 24h TTL (`EMAIL_VERIFICATION_TOKEN_TTL_HOURS`) | Consumed/expired tokens remain until cleanup **TODO** explicit purge | Medium | Token hashing; short TTL | Email delivery **TODO** — stub only |
| **Auth — password reset tokens** | `token_hash`, `expires_at`, `consumed_at` | Registered users | Account recovery | **Legitimate interests** (security) | No | Password reset request | `password_reset_tokens` | Same as above | Self-hosted | None | 30 min TTL | Same as verification tokens | Medium | Token hashing; short TTL | Email delivery **TODO** — stub only |
| **Auth — access tokens (JWT)** | Subject ID, role, expiry (not stored server-side) | Registered users; staff | API authorization | **Legitimate interests**; **Contract** | No | Issued at login/refresh | In-memory / client (15 min TTL) | Client memory; not in DB | Self-hosted | None | 15 minutes | Expires automatically | Medium | Short TTL; HTTPS | Implemented |
| **Lead / inquiry contact** | `first_name`, `last_name`, `email`, `phone`, `status` (`prospective`, `conflict_check`, `attorney_review`, `accepted`, `declined`, `filed`), `user_id`, timestamps | Prospective clients; registered clients | Respond to inquiry; conflict check; attorney review; intake pipeline | **Steps prior to contract**; **Legitimate interests** (evaluate inquiries); **Contract** once engaged | Possible indirect (case context) | Intake funnel | `leads` | Same as above | Self-hosted | Firm staff (admin/attorney) | While inquiry/matter active. **TODO confirm retention schedule with counsel** | Soft delete `deleted_at`; decline sets status; DSAR lead anonymization (`anonymized+{id}@deleted.local`) | Medium–High — contact + case linkage | RBAC; lead ownership for users; admin audit; DSAR correction fields | TODO — retention period |
| **Immigration intake** | `selected_package`, `case_type`, `notes` (free text), `additional_i130_count`, `expedited`, `pricing_min/max`, workflow statuses (`agreement_status`, `booking_status`, `payment_status`, `docketwise_status`) | Prospective clients; clients | Evaluate eligibility; pricing; prepare service/documents; attorney review | **Steps prior to contract** / **Contract**; **Legitimate interests**. **Art. 9 condition: TODO confirm with counsel** if notes/case_type reveal special categories | **Likely / TODO confirm** — immigration history, family, nationality, health references possible in `notes`/`case_type` | Intake form submission | `intakes` | Same as above | Self-hosted | Firm staff; future Docketwise (stub) | Matter lifecycle + legal/ethics obligations. **TODO define retention_until** | Cascade delete with lead; DSAR export; anonymization via linked user | **High** | Zod validation; optional notes; audit on submit (metadata only); Privacy Policy disclosure | Art. 9 basis TODO |
| **Consultation booking** | `consultation_type` (Zoom/Phone), `preferred_date_time`, `status` | Clients; prospective clients | Schedule consultation; operational coordination | **Contract** / **Steps prior to contract** | No | Intake final step | `bookings` | Same as above | Self-hosted | Firm staff | Linked to lead/matter retention **TODO** | CASCADE with lead | Low–Medium | Required for service workflow | TODO — retention |
| **Engagement agreements** | `title`, `html_content`, `status` (`draft`/`approved`), `approved_by`, `approved_at`, `review_notes` | Clients | Contracting; legal service workflow; recordkeeping | **Contract**; **Legal obligation** (professional recordkeeping — **TODO confirm**) | Possible in HTML content | Generated from intake | `agreements` | Same as above | Self-hosted; Chromium PDF subprocessor | Firm staff; client (own documents) | Engagement + recordkeeping period **TODO counsel** | CASCADE with lead; DSAR export | **High** | Attorney approval workflow; document view/download audit; PDF requires approved status | Retention TODO |
| **Onboarding packets** | Same structure as agreements | Clients | Document preparation; client instructions; attorney review | **Contract** | Possible in HTML content | Generated from intake | `onboarding_packets` | Same as above | Self-hosted; Chromium PDF | Firm staff; client | Same as agreements | Same as agreements | **High** | Same as agreements | Retention TODO |
| **Payment metadata** | `amount_min/max`, `status`, `billing_name`, `billing_email`, `payment_preference`, `consent_manual_processing`, `payment_method`, `hosted_payment_url`, `provider`, `provider_reference`, `notes`, `notes_redacted`, `manual_review` | Clients | Payment coordination; accounting; refund handling; manual follow-up | **Contract**; **Legal obligation** (tax/accounting — **TODO confirm period**) | No — card data not stored | Intake + admin updates | `payments` | Same as above | Self-hosted DB; **PSP TODO** (Stripe/LawPay/other) for hosted checkout | Firm staff; payment provider (external) | Accounting/compliance period **TODO**; audit tables 365d | DSAR export; note redaction flag; no PAN storage | Medium — billing PII; note misuse | Reject/redact card patterns (`paymentRedaction.js`); HTTPS hosted URL validation; `PAYMENT_HOST_ALLOWLIST` optional | PSP **TODO** |
| **Docketwise sync metadata** | `external_id`, `status`, `error_message`, `last_synced_at` | Clients (when integrated) | Case handoff to immigration CRM | **Contract**; **Legitimate interests** | Possible via linked intake | Admin sync action (stub) | `docketwise_sync` | Same as above | **Docketwise (planned)** — [matrix](./vendor-subprocessor-matrix.md) | Docketwise when live | Per Docketwise contract **TODO** | CASCADE with lead | Medium–High when live | Stub only today; DPA before go-live | **Stub — TODO** |
| **DSAR / privacy requests** | `request_type`, `status`, `identity_verification_status`, `legal_hold`, `legal_hold_reason`, `admin_notes`, `user_message`, `requested_changes`, `export_payload_json`, timestamps | Registered users (requesters) | Privacy rights handling; compliance; accountability | **Legal obligation** (GDPR/CCPA etc.); **Legitimate interests** (demonstrate compliance) | Possible in export payload (mirrors user data) | User DSAR portal; admin processing | `dsar_requests`, `dsar_request_events` | Same as above | Self-hosted | Admin/attorney; requester (own requests) | Request lifecycle + compliance archive. **Legal hold overrides deletion** | Completed requests retained **TODO period**; export payload in DB; anonymization blocked when `legal_hold=true` | Medium — aggregates personal data | Identity verification workflow; `assertNoLegalHold`; audit trail; payment note sanitization in admin notes | Retention period TODO |
| **Security audit events** | `event_type`, `category`, `action`, `result`, `actor_user_id`, `actor_role`, `target_type/id`, `request_id`, `ip_hash`, `user_agent`, `metadata_json`, `created_at` | Users; staff; subjects referenced in metadata | Security; compliance; accountability; incident investigation | **Legitimate interests**; **Legal obligation** (where applicable) | Unlikely in metadata (redacted) | Auth, intake, document, payment, DSAR, admin actions | `audit_events` | Same as above | Self-hosted | Admin (audit API) | **365 days** default (`SECURITY_AUDIT_RETENTION_DAYS`) | `deleteAuditEventsOlderThan` via retention job | Medium — metadata leakage | `sanitizeAuditMetadata`; intake logs field names not values; IP hashed in some contexts | Implemented |
| **Admin HTTP action log** | `user_id`, `method`, `path`, `status`, `request_id`, `created_at` | Staff | Admin mutation accountability | **Legitimate interests** | No | Admin API middleware | `admin_audit_log` | Same as above | Self-hosted | Admin | **365 days** default | `deleteAdminAuditLogsOlderThan` | Low–Medium | `auditAdminAction` middleware on `/api/admin` | Implemented |
| **Cookie consent preferences** | `consent_version`, `strictly_necessary`, `analytics`, `marketing`, `source`, `region_hint`, `user_agent_hash`, `ip_hash`, `anonymous_id`, `user_id` | Visitors; registered users | Consent management; ePrivacy audit trail; prove opt-in/opt-out | **Consent** (analytics/marketing); **Legitimate interests** (necessary cookies/logs) | No | Cookie banner / preferences UI | `cookie_consent_logs`; browser `localStorage` | DB: PostgreSQL. Browser: client device | Self-hosted | None | **90 days** in DB (`TECHNICAL_LOG_RETENTION_DAYS`); localStorage until cleared/version change | `deleteCookieConsentLogsOlderThan`; consent version invalidates old localStorage | Low (today — no analytics loaded) | Defaults false for optional categories; `loadAnalytics()` no-op; server-side hash of IP/UA | OK — revisit if analytics added |
| **Uploaded images (site media)** | Image binary; UUID filename; public URL path | Firm (admin uploader); indirect individuals if photos | Site branding; marketing images (logo, hero, services) | **Legitimate interests** (operate website) | Possible if image depicts person | Admin upload | Local filesystem `/app/uploads`; Docker volume `uploads_data` | Same host as backend. **Prod: TODO confirm** | Self-hosted; optional ClamAV ([matrix](./vendor-subprocessor-matrix.md)) | Public visitors (images served) | **TODO** — no automated purge in code | Manual delete; infra lifecycle; DSAR if personal | Medium — malicious file; unintended PII in images | MIME + magic-byte validation; path traversal protection; optional virus scan; image-only | Production storage region TODO |
| **Application / HTTP logs** | Request ID, method, path, status, timing; structured Pino fields | All API users | Operations; troubleshooting; security | **Legitimate interests** | Should not contain immigration payloads by policy | Express middleware | Container stdout / hosting logs | Hosting provider log sink **TODO rotation/region** | Hosting provider; self (app) | Ops/engineering | **90 days** target (technical logs policy) | Infra log rotation **TODO at deploy** | Medium if misconfigured logging | `httpLogger`; audit redaction separate from case content | Infra TODO |
| **Site settings (firm contact)** | `firm_name`, `phone`, `email`, `address`, branding URLs | Firm (not client PII) | Display contact info; site configuration | **Legitimate interests** | No | Admin settings | `site_settings` | Same as above | Self-hosted | Public website visitors | Indefinite (business config) | Admin update | Low | Admin-only write | N/A |
| **Email delivery (planned)** | Recipient email; verification/reset tokens in message body | Users | Account verification; password reset; notifications | **Contract**; **Legitimate interests** | No | Auth flows (when configured) | External email provider **TODO** | Provider region **TODO** | Email vendor **TODO** ([matrix](./vendor-subprocessor-matrix.md)) | Recipient mailbox | Provider-dependent **TODO** | N/A until configured | Medium | Use provider with DPA; minimize token exposure | **Stub only** — `email.service.js` |
| **Analytics / marketing (not enabled)** | Would include analytics IDs if added | Visitors | Site analytics / marketing only after opt-in | **Consent** (where required) | No | Third-party scripts (not present) | N/A | N/A | None configured | N/A | N/A | N/A | Low today | Consent manager ready; scripts not loaded | OK — document before enabling |

---

## Column guide (user-request mapping)

| Request (RU) | Column |
|---|---|
| какие данные | **Data Category** / **Example Fields** |
| зачем | **Purpose** |
| lawful basis | **Lawful Basis** |
| retention | **Retention** |
| location | **Location** |
| processor | **Processor/Subprocessor** |
| risk | **Risk** |
| mitigation | **Mitigation** |

---

## Lawful basis legend

Values used above are **indicative only** — confirm with privacy counsel:

| Basis | Typical use in this project |
|---|---|
| **Contract** | Account, intake, documents, payments for requested legal services |
| **Steps prior to contract** | Pre-engagement inquiry and intake evaluation |
| **Legitimate interests** | Security, audit, fraud prevention, firm operations |
| **Legal obligation** | Tax/accounting, privacy request handling, professional obligations |
| **Consent** | Optional cookies (analytics/marketing); manual payment processing checkbox at intake |
| **Art. 9 condition — TODO confirm** | Immigration/special-category data in intake notes and documents |

---

## Retention summary (implemented vs TODO)

| Data | Implemented retention | TODO |
|---|---|---|
| `cookie_consent_logs` | 90 days (automated purge) | — |
| `auth_refresh_tokens` (expired) | Purged on retention job | — |
| `audit_events`, `admin_audit_log` | 365 days (automated purge) | — |
| `dsar_requests` | Legal hold flag; no time-based purge in code | Define archive period |
| Leads, intakes, agreements, onboarding, payments, bookings | None automated | `retention_until`, counsel-defined schedules, legal hold on matters |
| Upload files | None automated | Lifecycle policy + cloud migration |
| HTTP/container logs | 90d policy target | Configure at hosting/nginx layer |

Constants: `backend/src/constants/retention.js`, env `TECHNICAL_LOG_RETENTION_DAYS`, `SECURITY_AUDIT_RETENTION_DAYS`.

---

## Location summary

| Environment | Database | Application / uploads | Logs |
|---|---|---|---|
| **Development (repo)** | Docker PostgreSQL 16, volume `pgdata` | Docker backend + `uploads_data` volume | Container stdout |
| **Production** | **TODO confirm** provider and region | **TODO confirm** VPS/cloud region | **TODO confirm** log sink and jurisdiction |

---

## Processors / subprocessors

Full matrix: **[vendor-subprocessor-matrix.md](./vendor-subprocessor-matrix.md)**

| Category | Status in repo |
|---|---|
| PostgreSQL | Used (Compose); production host TODO |
| Docker / NGINX | Compose deployment |
| Local file storage | Default `UPLOAD_STORAGE_DRIVER=local` |
| Chromium / Puppeteer | In-process PDF generation |
| ClamAV | Optional; disabled by default |
| Email | Stub — no vendor |
| Payment PSP | Manual hosted URL; provider TODO |
| Docketwise | Stub — no live API |
| Analytics | None |

---

## Open TODOs for counsel / operations

- [ ] Confirm lawful bases, especially Article 9 for immigration intake and generated documents
- [ ] Define retention periods for leads, intakes, documents, payments, DSAR archives
- [ ] Confirm production database and hosting regions
- [ ] Confirm and contract email, payment, and Docketwise processors
- [ ] Decide whether client document uploads will be added (not in current schema)
- [ ] Publish verified subprocessor list on website when vendors confirmed
- [ ] Review DPIA residual risk acceptance before launch

---

## Change log

| Date | Change |
|---|---|
| 2026-05-31 | Initial data map from repository inspection |
