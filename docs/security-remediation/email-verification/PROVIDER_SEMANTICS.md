# Provider Semantics

| Status | Meaning | User message |
| ------ | ------- | -------------- |
| `not_configured` | No provider; send not attempted | Honest not-configured wording |
| `accepted` | Provider accepted message | "Verification email sent" (only when configured) |
| `failed` | Provider error | Delivery failed; no false success |
| `delivered` | Reserved for future webhook confirmation | Not used as default today |

Registration/resend never returns verification token in production responses or audit logs.
