# Idempotency Remaining Risks

1. **Payment webhooks** — no provider callback deduplication; manual/hosted-link only.
2. **Docketwise configured sync** — provider adapter not implemented; DB dedupe only for unconfigured path.
3. **Email sends** — verification/resend not wrapped in idempotency table (token single-use separate).
4. **DSAR file deletion** — anonymization deletes files outside idempotency transaction.
5. **Retention dryRun=false** — replay returns summary; batch side effects not fully transactional with idempotency row.
6. **Cleanup scheduler** — manual/cron not bundled in app.
7. **HMAC secret rotation** — requires operational procedure.
