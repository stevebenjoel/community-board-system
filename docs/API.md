# API

`docs/openapi.json` is generated directly from runtime Zod command schemas with `pnpm api:generate`.

| Endpoint | Behavior |
| --- | --- |
| GET /health | Process liveness and selected mode |
| GET /api/v1/config | Public endpoint/project ID, never API key |
| POST /api/v1/session | Synchronize Appwrite identity with no privileged grant |
| GET /api/v1/workspace | Authorized/redacted aggregate projection and counts |
| POST /api/v1/commands | Validated workflow mutation, transaction, audit, notification |
| GET /api/v1/export | Authorized project/resolution JSON report |
| POST /api/v1/logout | Revoke synthetic session; SDK revokes Appwrite session |
| POST /api/v1/demo-session | Loopback synthetic profiles only; absent in production |

Example command:

```json
{"action":"submitCase","payload":{"category":"INF","title":"Water point needs assessment","description":"The community water point has been unavailable for several days.","jurisdiction":"imported-community-id","location":"Public water point","urgency":"NORMAL","clientRequestId":"unique-request-uuid"}}
```

Success returns the committed entity ID. Refresh the workspace for the generated tracking reference, state and server timestamp. Reporter identity is derived from the authenticated principal. Retrying a case submission uses the same request UUID.

Errors contain `error.code`, a safe `message`, and `requestId`. Strict schemas reject extra fields. JSON bodies are limited to 128 KiB. Gateway requests are limited to 180/minute per socket address. Behind Coolify, the socket address may be the proxy; configure edge rate limiting before launch rather than trusting arbitrary forwarding headers. Mutations check configured Origin. Synthetic requests additionally require a non-simple client header and SameSite HttpOnly session cookie.

Query limitation: the current workspace endpoint returns the authorized pilot dataset. Server-side cursor pagination and dedicated indexed resource queries are not implemented. This limits scale and must be addressed before national onboarding.

Evidence endpoints: POST /evidence (base64 JSON, 4 MiB decoded maximum), POST /evidence/{id}/scan, POST /evidence/{id}/download-token, GET /evidence/{id}/download?token=... . Every route rechecks parent-record access; downloads require a clean scan and account-bound expiring token. Only the evidence upload route has the larger bounded encoded body limit. See openapi.json and ADDITIONS_GUIDE.md.
