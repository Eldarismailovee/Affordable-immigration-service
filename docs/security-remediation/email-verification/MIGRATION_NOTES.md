# Migration 018 — Email Verification Security

Apply after 017. Adds:

- `users.pending_email`, `pending_email_requested_at`, `email_changed_at`
- `email_verification_tokens.email`, `purpose`, `invalidated_at`
- Indexes and purpose check constraint

Rollback: drop added columns/indexes in reverse order (manual).
