# Storage Policy

| Category | localStorage | sessionStorage | IndexedDB | Memory | Server |
| --- | ---: | ---: | ---: | ---: | ---: |
| Auth tokens | ✗ | ✗ | ✗ | ✓ access | ✓ refresh HttpOnly |
| User profile / role | ✗ | ✗ | ✗ | ✓ from `/api/auth/me` | ✓ |
| MFA secrets / codes | ✗ | ✗ | ✗ | ✓ flow only | ✓ enrollment |
| Intake / case-review PII | ✗ | ✗ | ✗ | ✓ unauth tab | ✓ auth drafts |
| DSAR / payment / agreements | ✗ | ✗ | ✗ | ✓ transient UI | ✓ |
| UI theme / language / consent | ✓ allowlist | ✗ | ✗ | ✓ | — |
| Return path (validated) | ✗ | ✓ | ✗ | ✓ router state | — |
| Idempotency keys | ✗ | ✗ | ✗ | ✓ retry map | ✓ server records |

Enforcement: `safeBrowserStorage.js` allowlist + `browserStoragePolicy.test.js` CI scan.
