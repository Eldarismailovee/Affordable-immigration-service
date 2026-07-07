# Remediation Plan P0–P4

## P0 — immediately

1. **AUTH-001:** public registration must always create `user`. Move first-admin bootstrap to a one-time deployment command using an out-of-band secret, transaction/advisory lock, explicit audit, and fail-closed startup. Migration: inspect all existing admins and creation timestamps; rotate credentials if provenance is uncertain. Regression: empty DB + public register remains user; concurrent registrations cannot create admins.

## P1 — before staging with real data

1. **PRIV-001:** implement transactional/resumable DSAR erasure manifest, child-table/file/provider cleanup, legal-hold exceptions, verification query and failure state; prohibit generic `completed` for deletion.
2. **BUS-001:** define canonical backend fields for relationship/location/deadline, add migration/constraints, make schemas `.strict()`, and add frontend/backend contract tests. Review whether already submitted records need client re-contact.
3. **BUS-002:** never emit/write `synced` without an authenticated provider response and persisted provider ID. Use `pending → syncing → synced|failed`, timeout, retry/backoff and idempotency.
4. **AUTH-002/AUTH-003:** require verified email for sensitive user flows and phishing-resistant MFA for staff/admin; add recovery codes, enrollment/revocation audit, step-up auth for DSAR/export/role changes.
5. **DEP-001:** upgrade Multer to ≥2.2.0, set minimal `fieldNestingDepth`, `fields`, `parts`, `headerPairs`, retain file size limit, and regression-test one bounded malformed request without stress.
6. Confirm production TLS, DB TLS with CA validation, backup snapshots and a successful isolated restore drill before real PII.

## P2 — before production

- Add idempotency keys and DB uniqueness for intake, booking, privacy and payment commands; define replay response semantics.
- Replace email/booking stubs with explicit `not_configured`/`queued` states; never claim sent/saved before durable acknowledgement.
- Make payment host allowlist mandatory in production and bind hosts to configured provider.
- Bound PDF queue length, total HTML/output size, per-user rate, browser/job timeout; isolate Chromium and re-enable sandbox.
- Remove intake PII from localStorage; add TTL and logout/success cleanup.
- Make DSAR export encryption mandatory, set restrictive file mode, support key rotation and deletion.
- Fix audit transaction semantics: propagate audit failure or use an outbox; verify COMMIT command/result and add rollback regression test.
- Add frontend/proxy headers, TLS redirect, cache-control for PII, explicit proxy timeouts and access-log token redaction.
- Remove GET unsubscribe token or prevent logging/redact path; use POST/body and one-time consumption.
- Make DAST blocking after baseline; pin Actions/images by SHA/digest; add secret/container/IaC scans and multi-project CycloneDX SBOM.
- Schedule retention jobs with locking, retry, metrics and alerting.

## P3 — hardening

- Add `iss`/`aud` JWT claims, per-account credential controls, breached-password checks and logout-all-devices.
- Add optimistic locking/`SELECT FOR UPDATE` to state transitions and concurrent tests.
- Configure container cap drop/read-only rootfs/tmpfs/resource/PID limits and readiness for Chromium/storage.
- Add API version/inventory documentation, content-type rejection tests, JSON duplicate-key policy and response cache tests.
- Add complete DSAR export inventory and privacy-provider reconciliation.

## P4 — maturity

- Quarterly threat-model reviews, restore/tabletop exercises and access recertification.
- Signed artifacts, SLSA provenance, SBOM publication/attestation and policy enforcement.
- SIEM correlation, anomaly detection, privilege-change and export alerts, tamper-resistant audit storage.
- Independent penetration test after P0–P2 and before production authorization.

## Acceptance gates

Staging with PII is blocked until P0/P1 regression tests pass, no unresolved Critical/High exists, a fresh dependency scan is clean/reachability-reviewed, authorization matrix runs against an isolated DB, secret scan succeeds, and backup/TLS/MFA evidence is attached.
