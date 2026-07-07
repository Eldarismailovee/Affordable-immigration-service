# Safe Dynamic Tests

## Safety preconditions

- No production/external target was contacted.
- No real PII, email, SMS, payment, provider API or destructive payload was used.
- Service/schema PoCs ran in Node with synthetic `example.invalid` identities.
- DB URL for focused tests was forced to non-existent `127.0.0.1:1/nonexistent`.
- No DoS payload, stress test, malformed multipart nesting or Chromium exploit was executed.
- No test data cleanup was required; no persistent DB/file was created.

## Executed

### DT-01 — Public role mass assignment vs implicit bootstrap

Предусловия: local schema/service tests. Endpoint model: `POST /api/auth/register`. Role: anonymous.

Request: synthetic registration with top-level and nested `role: admin`.

Expected: privileged properties rejected or ignored and server role always `user`.

Actual: Zod stripped both role fields (`parsedKeys` only name/email/password), so direct mass assignment is not exploitable. Separately, focused `auth.service` test passed and code assigns `admin` whenever `countUsers()===0`.

Impact: direct payload variant is mitigated; implicit first-user-admin remains Critical.

### DT-02 — Case review field preservation

Request: valid final intake with `petitionRelationship`, `location`, `hasUrgentDeadline`, `urgentDeadlineNotes`.

Expected: all four fields in parsed result.

Actual: parse succeeded and all four flags were absent. This proves silent strip before persistence.

### DT-03 — Booking replay

Request: call `createBookingRequest()` twice with identical synthetic payload.

Expected: durable ID or idempotent replay semantics.

Actual: both returned `success:true`, `status:requested`; neither contained a persistent ID and no repository is invoked.

### DT-04 — Payment host fail-open

Request: `https://attacker.example.invalid/pay` with `allowedHosts=[]`, then with a nonmatching allowlist.

Actual: accepted with empty allowlist; rejected with configured allowlist.

### DT-05 — Focused security tests

Passed: access ownership/IDOR policy, auth role behavior, JWT/password helpers, refresh cookie flags, refresh rotation/reuse, hosted-payment URL checks, HTML template escaping, email verification/reset unit flows. Frontend tests passed 12/12. Focused backend security group passed 5/5 and service group passed 7/7.

## Failed / incomplete

- Full backend: 41/52 test files passed; all 11 API test files failed to start under network sandbox. An escalation request for a localhost ephemeral listener was not completed.
- Root tests: 2/3 files passed. `tests/intake.validation.test.js` contains a stale “valid” payload missing new `consentAvailabilityAcknowledgment`; direct execution showed 2 pass / 2 fail assertions.
- Full HTTP authz matrix, CORS/preflight, headers through Nginx, malformed JSON/content-type/body limit, upload mismatch/cleanup, PDF and DB rollback PoCs: `NOT_EXECUTED_SAFETY` or `NOT_EXECUTED_ENVIRONMENT`.
- Docker stack was not started: existing volume provenance/non-production status could not be confirmed and daemon access was unavailable.
- DAST/ZAP not run locally; no approved isolated live target.

## Tests intentionally not run

| Test | Status | Reason |
|---|---|---|
| Multer deep nesting / aborted upload | NOT_EXECUTED_SAFETY | DoS/disk accumulation prohibited |
| PDF queue exhaustion | NOT_EXECUTED_SAFETY | load/resource attack prohibited |
| Chromium sandbox escape | NOT_EXECUTED_SAFETY | exploit execution prohibited |
| Real email/Docketwise/payment | NOT_EXECUTED_SAFETY | external/paid/real side effects prohibited |
| Production TLS/MFA/backup restore | NOT_VERIFIED | no production access/configuration |
| Live PostgreSQL rollback PoC | NOT_EXECUTED_ENVIRONMENT | no confirmed isolated DB |
