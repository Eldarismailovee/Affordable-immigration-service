# Threat Model — AUTH-003

## Threats mitigated

- Unverified account accessing intake/DSAR/documents
- JWT/body spoofing of `emailVerified`
- Token replay, wrong-purpose token use
- Email enumeration via resend
- False "sent" when provider stubbed

## Out of scope this pass

- Breached-password checking, per-account login lockout (credential policy partially separate)
- Real ESP webhooks for delivery confirmation
