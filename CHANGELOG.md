# Changelog

## [Unreleased]
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

### Known issues
- `server.js` requires `helmet`, which is neither in `package.json` nor installed.

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