# Changelog

## [Unreleased]
### Security
- **The BFF can verify the TLS certificate of backbone-rest.** `proxy.js` created its agent with `rejectUnauthorized: false`, so
  anyone between the BFF and backbone could read the session token. With `BACKBONE_CA_PATH` (PEM of the CA that signed backbone's
  certificate) and, if needed, `BACKBONE_TLS_SERVERNAME`, the certificate and its name are verified; a wrong CA or name answers
  `502`. `BACKBONE_TLS_INSECURE=true` turns it off on purpose. Without any of them the previous behaviour is kept and a warning is
  logged at start, so existing deployments keep working until the CA is mounted. Checked live against backbone: right CA → login
  `200`; wrong CA → `502`.
- **CORS is explicit.** `CORS_ORIGIN` accepts a list of origins; `*` is refused in production (the BFF does not start) and an
  empty value in production now means same origin only. In development an empty value still allows any origin.

### Added
- **The person's real IP and browser reach backbone's audit trail**: every proxied call carries `X-Forwarded-For` (always the
  address Express resolved, never copied from the caller) and `X-Forwarded-User-Agent`. Until now 63 % of login events showed the
  BFF's own `axios` user agent. Backbone honours them from `UMDC_AUDIT_TRUSTED_PROXIES`. Checked live: the audit event of a login
  through the BFF stored the browser's user agent.
- `GET /healthz`, a liveness probe that touches no dependency and is outside the rate limit.
- 19 new BFF tests (TLS against a real HTTPS server with a generated CA, CORS, origin headers, health, proxy); the new modules
  have 100 % coverage.
- `docker-compose.yml` passes `BACKBONE_CA_PATH` and `BACKBONE_TLS_SERVERNAME`; technical and user guides updated (Spanish, with
  Mermaid diagrams).

### Added
- Session: automatic renewal (`refresh` with `renew` fallback) shortly before the token expires, token validation at startup, and email login next to alias login. Refreshed tokens are now persisted so the interceptor never sends a stale one.
- Applications: delete (with confirmation), filter by IDs, profile image upload and reference.
- Users: exact alias lookup (`userByAlias` + alias record with resolved roles), roles preloaded from `GET /roles/user/{id}`, and a "full detail" save (`PUT /users/{id}/full-detail`).
- Roles / contact types / service types: filter by IDs and by status through the dedicated backbone endpoints.
- New pages: Features (`/features`), Contacts (`/contacts`), IAM tools (`/iam`: token introspection and permission check) and Reports (`/reports`: Word templates, placeholders and document generation).
- Managed clients: issue and introspect M2M tokens.
- Audit: server-side filters (event type, user, application, date range), the real `AuditEventTO` fields, and an export that respects the applied filters.
- Header avatar from `GET /profile/image/`.
- BFF: routes for every endpoint above, multipart/binary proxying (`proxyMultipart`, `responseType: 'arraybuffer'`) and 302→200 mapping for `report/placeholdervalues`.
- Tests: Karma specs for every file (statements ≥ 99 %, branches ≥ 89 %, 85 % enforced in `karma.conf.js`) and `node:test` specs for the BFF (`pnpm run test:server`).
- Sync with backbone-rest (T-79 → T-92): application-scoped, server-paginated contacts directory and owner lookup (`GET /contacts/`, `/contacts/owner/{type}/{id}`), paginated feature catalog with roles-per-feature (`GET /features/`, `/features/{id}/roles`), user activation (`PUT /users/application/{a}/user/{u}/activate`), 409 handling on repeated alias/e-mail, and session logout that revokes tokens (`POST /session/logout`, validate/renew via `session-token` header).

### Changed
- `401` responses now clear the session before redirecting to the login page.
- Contacts: `GET /contacts/list-all` and `ContactService.getAll` removed in favour of the paginated directory.
- `api.yaml` re-synced with `backbone-rest`.


## [0.0.0] - 2026-07-05
### System Info
- Node.js Version: v24.18.0
- TypeScript Version: ~6.0.3

### Added
- Initial Project Setup (Initial Import)
- Angular 22.0.4 & Express.js BFF integration
- Core services, state management, and backend proxy layers established.
- Unified API constants and model definitions.

## Status: Active Development