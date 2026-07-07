# Draft Storage Model

## Authenticated intake (`/intake/*`)

- **Server-side** table `intake_drafts` (migration `020_secure_intake_drafts.sql`)
- API: `GET|PUT|DELETE /api/account/intake/draft`
- Requires auth + verified email (account router middleware)
- One draft per user; JSON schema validated; 30-day expiration
- Optimistic concurrency via `version` field (409 on conflict)
- Autosave: debounced 1.5s PUT from `IntakeContext`
- UI status: Saving / Saved / Failed (no false Saved on error)
- Final submit (`POST /api/account/intake`) marks draft submitted / closes draft
- Included in DSAR deletion via `deleteIntakeDraftsForUser`

## Public case review (`/case-review`)

- **Memory-only** (Variant A)
- User warned that reload closes tab data
- After sign-in, user continues to authenticated intake with server drafts

## Not implemented

- Anonymous server-issued draft tokens (no product requirement)
- localStorage fallback for drafts

## Agreement preview / submission result

- Kept in React memory only; excluded from draft payload autosave
- Cleared on `resetIntake()` after success or logout
