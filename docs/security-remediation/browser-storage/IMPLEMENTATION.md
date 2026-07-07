# DATA-001 Implementation — Sensitive Browser Storage

Date: 2026-07-06. Status: **FIXED** (browser E2E: NOT_VERIFIED_BROWSER_E2E).

## Summary

Removed all persistent client-side PII storage. Intake drafts for authenticated users moved to server-side `intake_drafts`. Public case-review remains memory-only with explicit UX warning. Centralized allowlisted storage module, legacy cleanup migration, cache headers, and policy tests added.

## Frontend changes

| File | Change |
| --- | --- |
| `services/safeBrowserStorage.js` | Allowlisted persistent storage |
| `services/legacyStorageCleanup.js` | Versioned legacy key removal |
| `services/sessionNavigationStorage.js` | Validated session return path |
| `context/IntakeContext.jsx` | Memory + server autosave; no localStorage |
| `context/AuthContext.jsx` | Logout cleanup, multi-tab BroadcastChannel |
| `lib/cookieConsent.js` | Migrated to `ais.ui.cookieConsent` |
| `main.jsx` | Boot-time legacy cleanup |
| `utils/safeReturnPath.js`, `utils/safeLog.js` | URL validation, redacted logging |
| `pages/CaseReviewPage.jsx` | Memory-only warning |
| `pages/UnsubscribePage.jsx` | Token stripped from URL after use |
| `tests/browserStoragePolicy.test.js` | CI storage policy scan |

## Backend changes

| File | Change |
| --- | --- |
| `db/migrations/020_secure_intake_drafts.sql` | Draft table |
| `repositories/intake-draft.repository.js` | CRUD + versioning |
| `services/intake-draft.service.js` | Draft business logic |
| `controllers/intake-draft.controller.js` | Draft HTTP handlers |
| `routes/account/intake.routes.js` | Draft routes |
| `middleware/noStore.js` | Cache-Control for sensitive APIs |
| `services/dsar-deletion.service.js` | Draft deletion in DSAR workflow |
| `tests/api/intake-draft.api.test.js` | Draft + cache header tests |

## Out of scope (this pass)

Docker hardening, observability, external providers, backup infrastructure, client-side encryption, new analytics.
