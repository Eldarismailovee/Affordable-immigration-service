# Vendor / Subprocessor Matrix

**Project:** Affordable-immigration-service  
**Last updated:** 2026-05-31  
**Maintainer:** Engineering / operations (internal)  
**Review cadence:** Update when vendors, regions, or integrations change; have privacy counsel review before production launch.

> **TODO:** Have this matrix reviewed by privacy counsel before production launch.  
> **TODO:** Confirm actual vendor contracts, DPAs, SCCs, and DPF certifications directly from vendor portals/contracts.

Evidence sources: `docker-compose.yml`, `backend/.env.example`, `backend/src/config/env.js`, `README.md`, deployment configs, and service implementations in `backend/src/services/`.

---

## Matrix

| Category | Vendor | Service / Product | Role | Purpose | Data Categories | Personal Data? | Sensitive Data? | Processing Region | EU Transfer? | DPA Status | SCC Status | DPF Status | Retention / Deletion | Security Notes | Contract Owner | Review Date | Status / TODO |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hosting | TODO confirm production hosting provider | VPS / cloud compute (not named in repo) | processor | Run Dockerized frontend, backend, nginx, and volumes in production | Account data; contact data; immigration intake data; uploaded documents; payment metadata; technical logs; DSAR/audit records | yes | yes (immigration intake, documents) | unknown | unknown | required | unknown | unknown | Per hosting provider terms; app data deleted per retention policy / DSAR | README documents Docker + Nginx deploy to VPS; no Render/Railway/Fly/AWS config in repo | TODO | 2026-05-31 | TODO confirm vendor and region |
| hosting | Docker (Moby) | Container runtime | subprocessor (infra component) | Package and run application services | Technical logs; container filesystem (includes uploads volume mount) | yes | yes (via app data on volumes) | Same as hosting provider | unknown | unknown | unknown | not applicable | Ephemeral container layers; persistent data on named volumes | Used in `docker-compose.yml` for all services | TODO | 2026-05-31 | TODO confirm if counted separately for DPA |
| hosting | NGINX (F5 / nginx.org) | Reverse proxy (`nginx:stable-alpine`) | subprocessor (infra component) | Terminate HTTP, proxy `/api/` and `/uploads/` to backend, serve frontend | Technical logs (IP, User-Agent via proxy headers); request metadata | yes | no | Same as hosting provider | unknown | unknown | unknown | not applicable | Access logs depend on hosting/nginx log rotation | Config in `deploy/nginx.conf`; no TLS config in repo (HTTPS TODO at deploy time) | TODO | 2026-05-31 | pending review |
| database | PostgreSQL | PostgreSQL 16 (`postgres:16-alpine` in Compose) | processor | Primary application database (leads, intakes, users, payments, audit, DSAR, uploads metadata) | Account data; contact data; immigration intake data; payment metadata; DSAR/audit records; cookie consent logs | yes | yes (immigration intake fields) | unknown (local Docker volume in repo; production provider TODO) | unknown | required | unknown | unknown | Technical logs 90d; security audit 365d (`backend/src/constants/retention.js`); DSAR/case records subject to legal hold | `DATABASE_URL` in env; SSL configurable via `DB_SSL` | TODO | 2026-05-31 | TODO confirm production database host and region |
| email | Not configured / TODO confirm vendor | Email delivery (stub) | processor | Account verification, password reset, confirmations | Contact data (email addresses); auth tokens in email body | yes | no | unknown | unknown | required | unknown | unknown | N/A until provider configured | `backend/src/services/email.service.js` returns stub responses only; no SMTP/SendGrid/Mailgun/Resend/Postmark env vars | TODO | 2026-05-31 | TODO confirm production email provider |
| analytics | None currently configured | — | — | Site usage analytics (consent-gated) | Cookie/analytics identifiers (if enabled) | no (not loaded) | no | N/A | no | not required | not needed | not applicable | N/A | `frontend/src/lib/cookieConsent.js` has consent UI but `loadAnalytics()` is a no-op; no GA/GTM/PostHog scripts in `frontend/index.html` | N/A | 2026-05-31 | OK — revisit if analytics added |
| Docketwise | Docketwise | Immigration case management / CRM (planned) | processor | Lead/case handoff and immigration workflow (intended) | Contact data; immigration intake data; case/sync metadata; document metadata | yes | yes | unknown (vendor SaaS; API not connected) | unknown | required | unknown | unknown | Per Docketwise contract (TODO) | Integration is **stub only**: `docketwise.service.js`, admin sync marks status without live API; README notes not production-ready | TODO | 2026-05-31 | TODO confirm whether/when production API integration and DPA |
| payment | TODO choose Stripe / LawPay / other | Hosted payment link (manual admin URL) | independent controller (typical for PSP) | Collect payment for legal services via third-party checkout | Billing contact; payment status; provider reference IDs; hosted payment URL | yes | no (card data not stored in app) | unknown (depends on chosen PSP) | unknown | required | unknown | unknown | Payment/audit records per security audit retention (365d default) | App stores `hostedPaymentUrl`, `provider`, `providerReference` only; `PAYMENT_HOST_ALLOWLIST` optional; Stripe used in tests/placeholders only; no webhooks yet | TODO | 2026-05-31 | TODO choose and contract payment provider |
| storage | Local server storage / hosting volume | Local filesystem (`UPLOAD_STORAGE_DRIVER=local`) | processor | Store uploaded images (logo, marketing media) | Uploaded documents (images); filenames | yes | possible (images may depict individuals) | Same as hosting provider | unknown | required | unknown | unknown | Deleted with file lifecycle / DSAR; cloud migration TODO per README | `backend/src/services/upload-storage.service.js`; Docker volume `uploads_data`; MIME/magic-byte validation; optional ClamAV scan (`UPLOAD_VIRUS_SCAN_*`) | TODO | 2026-05-31 | TODO confirm production storage location; consider S3/R2/GCS |
| logging | Application (self-hosted) | Pino → stdout / container logs | processor | Operational and security logging | Technical logs; audit metadata; redacted payment fields | yes | possible (immigration data should not appear in logs by policy) | Same as hosting provider | unknown | required | unknown | not applicable | Technical logs 90d target; security audit DB 365d | `backend/src/lib/logger.js`; audit in PostgreSQL (`audit_events`) | TODO | 2026-05-31 | pending review |
| PDF/document generation | Google Chromium (OSS) via Puppeteer | In-process PDF rendering (`puppeteer-core` + system Chromium) | subprocessor (infra component) | Generate agreement and onboarding PDFs from HTML | Immigration intake data; engagement/onboarding content in generated PDFs | yes | yes | Same as backend container (hosting provider region) | unknown | unknown | unknown | not applicable | PDFs generated in memory/streamed; not persisted as files by default | `backend/src/services/pdf.service.js`; Chromium installed in backend Dockerfile | TODO | 2026-05-31 | pending review |
| storage (optional) | ClamAV | Virus scanning (`clamdscan`, disabled by default) | subprocessor (infra component) | Scan uploads for malware when enabled | Uploaded file content (transient scan) | yes | possible | Same as hosting provider | unknown | unknown | unknown | not applicable | Files scanned at upload when `UPLOAD_VIRUS_SCAN_ENABLED=true` | Optional; not enabled in default `.env.example` | TODO | 2026-05-31 | TODO confirm if used in production |

---

## Open Compliance Questions

- Confirm production hosting provider and region.
- Confirm production database provider and region (managed Postgres vs. co-located on VPS).
- Confirm email provider and DPA.
- Confirm payment provider: Stripe, LawPay, or other; sign PSP DPA and record transfer mechanism.
- Confirm whether analytics/marketing tools will be added before launch.
- Confirm Docketwise production API integration timeline and DPA/SCC/DPF status.
- Confirm storage location, backup jurisdiction, and file deletion policy (local volume vs. object storage).
- Confirm HTTPS/TLS termination and log retention at nginx/hosting layer.
- Confirm whether ClamAV or another scanner will run in production.

---

## EU Transfer Review

For each vendor receiving EU personal data outside the EEA or an adequacy country, confirm:

| Vendor (when confirmed) | Transfer mechanism | DPA | SCCs or DPF | Subprocessors | Processing regions | Retention/deletion |
|---|---|---|---|---|---|---|
| Production hosting provider | TODO | TODO | TODO | TODO (e.g. underlying cloud) | TODO | TODO |
| Production database provider | TODO | TODO | TODO | TODO | TODO | TODO |
| Email provider | TODO | TODO | TODO | TODO | TODO | TODO |
| Payment provider (Stripe/LawPay/other) | TODO — likely US SaaS; verify DPF list or SCCs | TODO | TODO | TODO (PSP subprocessors) | TODO | TODO |
| Docketwise | TODO | TODO | TODO | TODO | TODO | TODO |
| Object storage (if migrated from local) | TODO | TODO | TODO | TODO | TODO | TODO |

**Notes:**

- If vendor processes EU personal data **only** within the EEA or an adequacy country, SCCs may be **not needed** — confirm location with vendor documentation.
- DPF certification applies **only** if the US vendor is listed on the [EU-US Data Privacy Framework](https://www.dataprivacyframework.gov/) list at the time of processing — do not assume certification from US incorporation alone.
- Until production vendors and regions are confirmed, treat EU transfer risk as **unknown** and complete this table before processing EU data in production.

---

## Data Categories Legend

- **Account data** — user ID, credentials, roles, email verification state
- **Contact data** — name, email, phone, address, billing contact
- **Immigration intake data** — case inquiry, package selection, family petition details, consultation booking
- **Uploaded documents** — images/files submitted via intake or admin (e.g. logo, marketing media)
- **Payment metadata** — payment status, hosted payment URL, provider name, provider reference (no full card numbers)
- **Technical logs** — IP address, User-Agent, request metadata, application logs
- **Cookie/analytics identifiers** — consent preferences; analytics IDs if tools are enabled later
- **DSAR/audit records** — data subject requests, audit events, admin actions, legal hold flags

---

## GDPR Article 28 Reminder

- Processors/subprocessors should be governed by written terms / DPA.
- The controller should maintain an accurate list of processors and authorize subprocessors.
- This matrix is an **internal working document** until counsel review and vendor confirmation are complete.

---

## Change Log

| Date | Change |
|---|---|
| 2026-05-31 | Initial matrix from repository inspection; unknowns marked TODO |
