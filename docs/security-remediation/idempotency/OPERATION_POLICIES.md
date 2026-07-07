# Operation Policies

| Operation | Scope | Hash fields | TTL (s) | Replay result | External effect |
| --------- | ----- | ----------- | -------: | ------------- | --------------- |
| `intake.create` | `user:{id}` | body | 86400 | Full intake response (no tokens) | None |
| `dsar.create` | `user:{id}` | body | 86400 | DSAR request summary | None |
| `dsar.public.create` | `anonymous:public` | body | 86400 | Public ack (id/type/status) | None |
| `dsar.anonymize` | `admin:{id}` | path `requestId`, body | 86400 | Status-only DSAR (no export) | File delete **partial** |
| `dsar.export` | `admin:{id}` | path `requestId` | 86400 | Status-only DSAR | None in DB export store |
| `payment.hosted_url.set` | `admin:{id}` | path `leadId`, body | 86400 | Payment snapshot | Provider URL not fetched server-side |
| `payment.status.update` | `admin:{id}` | path `leadId`, body | 86400 | Payment snapshot | No webhook |
| `admin.user.role.change` | `admin:{id}` | path `userId`, body | 86400 | Sanitized user | None |
| `admin.user.delete` | `admin:{id}` | path `userId` | 86400 | Sanitized user | None |
| `mfa.admin.reset` | `admin:{id}` | body | 86400 | Message response | Revokes tokens (replay returns message only) |
| `docketwise.sync` | `admin:{id}` | path `leadId` | 86400 | Sync snapshot | Provider **not verified** |
| `agreement.generate` | `admin:{id}` | path `leadId` | 86400 | Generation result | PDF bytes not in replay store |
| `agreement.approve` | `admin:{id}` | path `leadId`, body | 86400 | Agreement snapshot | None |
| `retention.run` | `admin:{id}` | body | 86400 | Run summary | Batch mutations **partial** if dryRun=false retry |
| `retention.action` | `admin:{id}` | body (incl. action) | 86400 | Action result | Same as retention.run |

Hash algorithm: canonical JSON of `{ operation, actorScope, body, pathParams, queryParams }` after Zod validation.
