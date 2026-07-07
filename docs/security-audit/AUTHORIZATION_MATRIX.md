# Authorization Matrix

Legend: `200/2xx` allowed, `401` unauthenticated, `403` wrong role/owner, `N/A` not applicable. Results combine route/service trace and focused policy tests; the full HTTP matrix was not executed because sandbox blocked the local listener.

| Endpoint group | Anonymous | User-owner | User-foreign | Attorney | Admin | Фактический результат |
|---|---:|---:|---:|---:|---:|---|
| `/api/public/**` | 2xx | 2xx | 2xx | 2xx | 2xx | Public by design |
| `POST /api/auth/register/login/reset` | 2xx | 2xx | 2xx | 2xx | 2xx | Public auth flow |
| `GET /api/auth/me` | 401 | 200 | 200 | 200 | 200 | `requireAuth` |
| `/api/account/leads` | 401 | 200 own list | own list only | own list semantics | own list semantics | query filters `l.user_id` |
| account agreement/onboarding HTML | 401 | 200/404 | 403 | 200 only visible lead state | 200 | `assertLeadAccess` |
| account agreement/onboarding PDF | 401 | 200 only approved | 403 | 200 only approved/visible | 200 only approved | ownership + packet status |
| account DSAR detail/export | 401 | 200 own | 403 | only own via account route | only own via account route | `userOwnsRequest`; export also identity gate |
| `POST /api/account/intake` | 401 | 201 | 201 own new object | 201 | 201 | auth only; no privileged behavior |
| `/api/admin/leads` | 401 | 403 | 403 | 200, all configured states visible | 200 | top-level `staff` role |
| admin lead delete | 401 | 403 | 403 | 403 | 2xx | endpoint `adminOnly` |
| `/api/admin/users/**` | 401 | 403 | 403 | 403 | 2xx | top-level `adminOnly` |
| agreement/onboarding generate/approve | 401 | 403 | 403 | 2xx subject to state | 2xx subject to state | endpoint-level staff check |
| `/api/admin/docketwise/**` | 401 | 403 | 403 | 403 | 2xx | top-level `adminOnly` |
| `/api/admin/payments/**` | 401 | 403 | 403 | 403 | 2xx | top-level and service admin checks |
| `/api/admin/uploads/**` | 401 | 403 | 403 | 403 | 2xx | top-level `adminOnly` |
| admin DSAR list/detail | 401 | 403 | 403 | 200 | 200 | `staffRead` |
| admin DSAR mutate | 401 | 403 | 403 | legal-hold only | 2xx | explicit role checks |
| audit/retention/site settings | 401 | 403 | 403 | 403 | 2xx | top-level `adminOnly` |

## Evidence and conclusions

- `backend/src/app.js:84-87` separates public, auth, account and admin routers.
- `backend/src/routes/admin/index.js:16-29` assigns role middleware.
- `backend/src/domain/lead.policy.js:5-26` enforces owner/staff access.
- `backend/src/services/dsar.service.js:113-137` enforces DSAR ownership.
- Focused tests: `backend/tests/services/access.service.test.js` passed, including foreign-owner denial.
- No confirmed IDOR was found. A remaining risk is operational: `AUTH-001` lets an anonymous first registrant legitimately obtain the role that all these controls trust.
- Deleted/stale access token: `getUserFromAccessToken()` reloads the user and rejects non-active/deleted accounts. Role changes take effect on the next request because DB role is reloaded.
