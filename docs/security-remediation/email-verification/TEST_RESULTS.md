# AUTH-003 Test Results

| Suite | Result |
| ----- | ------ |
| Backend `npm test` | PASS (336/336) |
| Frontend `npm test` | See frontend run |
| PostgreSQL integration 018 | NOT_VERIFIED_ENVIRONMENT (requires `RUN_EMAIL_VERIFICATION_PG_INTEGRATION=1`) |

Key regression coverage: `backend/tests/api/email-verification.api.test.js`, updated account/admin/MFA tests, `frontend/tests/emailVerification.test.js`.
