# MFA Remaining Risks

- PostgreSQL concurrency tests marked `NOT_VERIFIED_ENVIRONMENT` unless `RUN_MFA_PG_INTEGRATION=1`.
- Email notification on recovery-code use pending real email provider configuration.
- Encryption key rotation re-encryption job not automated.
- WebAuthn/passkeys not implemented (TOTP only).
- Per-endpoint step-up max ages should be reviewed as threat model evolves.
