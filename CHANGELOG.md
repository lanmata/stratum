# Changelog

## [Unreleased]
### Fixed
- Roles list: excluding inactive roles now filters the application's own roles locally instead of intersecting with a second request for roles by status.

### Changed
- **Dependencies updated**: tailwindcss and @tailwindcss/postcss 4.3.4, express-rate-limit 8.7.3, ESLint 10 with @eslint/js 10 (two spec
  lines flagged by the new `no-useless-assignment`/`prefer-const` rules cleaned up), and the unused, deprecated `crypto-js` removed.
  Angular 22, NgRx and the rest were already at their latest. Held back on purpose: TypeScript 7 (Angular 22's compiler requires
  `<6.1`) and Jasmine 7 / `@types/jasmine` 7 (jasmine-core 7 breaks `zone.js/testing`, which the unit tests still load).
- **Zoneless change detection**: `provideZonelessChangeDetection()` replaces the zone-based provider and `zone.js` is no longer a
  polyfill of the production build. `zone.js` stays only as a polyfill of the unit tests, because ~30 of them use `fakeAsync`.
  506 unit tests and the 5 e2e flows (also with `SESSION_COOKIE=true`) pass.
- **`@defer (on viewport)`** for the three lower charts of the usage page (hours, heatmap, months): they load when they scroll into view.
  The unit spec renders the deferred blocks explicitly and the e2e scrolls to them.

### Changed
- **`OnPush` change detection in every component** (36 of 44 were on the default strategy; `roles-list` is untouched until its pending
  change lands). The 506 Angular tests, lint, SSR build and the 5 e2e flows pass; the mutable fields left in components are not bound
  in templates. Zoneless (`provideZonelessChangeDetection`) is the next step and is not enabled yet.

### Added
- **Server-side sessions** (`SESSION_COOKIE=true`, off by default): the BFF keeps the real session and refresh tokens (Redis, memory
  fallback) and hands the browser an opaque `HttpOnly; SameSite=Strict` cookie plus unsigned copies of the tokens, so injected script can
  no longer steal a usable token. State-changing calls with the cookie must also carry the `session-token` header (CSRF) or get `403`.
  Login, refresh, renew and logout are handled; old sessions keep working. 16 new BFF tests (160 total, coverage above the 85 % gates).
- `docs/14-sesion-en-servidor.md` (guide in Spanish, Mermaid).

### Added
- **End-to-end tests** (Playwright, `pnpm run test:e2e`): the real BFF serving the built app against a fake backbone, driven by the
  Chrome already installed (no browser download), with a throwaway TLS certificate. Five flows: wrong password, sign-in and menu, the
  usage page (tiles, six charts, table), the hover tooltip and the period change. New `e2e` job in the CI that uploads traces on failure.
- `docs/13-pruebas-e2e.md` (user and technical guide in Spanish, Mermaid).

### Added
- **Typed contract with backbone-rest**: `api.yaml` refreshed from the live OpenAPI (3,474 → 4,634 lines; it lacked the reports) and
  TypeScript types generated with `openapi-typescript` (`pnpm run api:types`, `api:sync`, `api:check`; the CI fails on drift). A spec
  checks at compile time that the usage-report models match the generated schemas.

### Changed
- The usage page and its guide say that, without `AUDIT_READ_ALL`, only the session's own application is shown (backbone now scopes the
  reports).

### Added
- **Usage and access reports** (`/usage`, menu *Herramientas*, "Uso y accesos"): how many people use the platform, when they connect
  and from which kind of client, application by application, to size the platform and decide its scope. Dark gradient board with four
  headline tiles, logins per week (gradient area with failed attempts and hover tooltip), who connects (donut by device class and
  browser), activity per application, a sizing panel (average and peak week, peak hour), logins per hour of the day, a weekday by
  time-slot heat map, logins per month and a reach table (registered people, active people, roles). Period presets or custom dates and
  an application filter. Aggregated numbers only.
- Charts are plain SVG components with signals and pure, tested drawing functions (no charting library; the lazy chunk is ~35 kB).
  The palette was validated for colour-blind separation and contrast; charts carry roles, labels and `<title>` tooltips.
- BFF routes for the six report endpoints of backbone-rest (`/api/v1/iam/audit/reports/*`), covered by the table-driven route test.
- `docs/12-reportes-uso.md` (user and technical guide in Spanish, with a Mermaid diagram) and index entries for the CI guide and the
  reports.
- 55 new Angular tests and 6 BFF tests; overall Angular coverage stays at 98.9 % statements.

### Notes
- Needs the `AUDIT_READ` feature in backbone-rest. A banner explains when most events come from API clients (the BFF forwards the
  person's browser since the previous change, but earlier events cannot be corrected).
- Verified live in Chrome against backbone-rest on `remote-supabase`: real data in every chart, tooltip on hover, no horizontal
  overflow at 400 px, no console errors. Found and fixed two defects that way (a month label cut at the right edge, non-round ticks on
  the hour chart).

### Added
- **CI**: `.github/workflows/ci.yml` runs on pull requests and on pushes to `develop`: a `quality` job (ESLint, BFF tests with the
  85 % gate, `pnpm audit --audit-level high`) and a `web` job (Karma in headless Chrome with the 85 % gate, production SSR build,
  coverage artifact).
- **ESLint** (`eslint.config.js`, `pnpm run lint`): typescript-eslint, angular-eslint and the template accessibility rules, plus the
  BFF. It found 37 real problems, all fixed.
- `README.md` rewritten (it was the Angular CLI template) and `CLAUDE.md` brought to Angular 22 / NgRx 22 / TypeScript 6.
- `docs/11-guia-tecnica-ci.md` (technical guide, Mermaid).

### Fixed
- **Accessibility:** 32 form labels had no associated control; each `<label>` now has `for` and its control an `id`, so clicking a
  label focuses the field and screen readers announce it. The two dialog backdrops carry `role="presentation"`.

### Security
- **Dependencies:** `pnpm audit` went from 65 vulnerabilities (1 critical, 38 high) to 1 moderate, development only. Updated within
  the ranges (`pnpm update`), aligned `@angular/router` and `@angular/ssr` with the rest of Angular (`^22.2.1`) and removed
  `toml`, declared twice and never used. Verified with lint, the production build, 138 BFF tests and 450 Angular tests.

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