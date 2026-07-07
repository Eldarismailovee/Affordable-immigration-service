# Remaining Risks — AUTH-003

- PostgreSQL atomicity of concurrent verify not exercised in CI (`NOT_VERIFIED_ENVIRONMENT`).
- Real email provider delivery/tracking not integrated; `accepted` ≠ delivered.
- Password reset does not auto-verify email (intentional); users must complete separate verification.
- JWT `emailVerified` claim may lag until refresh; gates use DB state.
