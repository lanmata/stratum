# Stratum — Claude Code Agent Infrastructure

## Project Snapshot

| Field | Value |
|-------|-------|
| Name | front-backbone-rest |
| Framework | Angular 20 (`@angular/core` ^22.0.4), standalone components, new control flow |
| Language | TypeScript 5.9 strict (`typescript ~6.0.3`) |
| Package manager | pnpm (pinned via `package.json#packageManager`) |
| BFF | Express 5 (`express` ^5.2.1) — `server.js` + `server/routes/` |
| State management | NgRx 20 (session only) + Angular Signals (component state) |
| Styling | Tailwind CSS v4 |
| Auth | `session-token` header via `authInterceptor`; `StorageMockService` for SSR-safe storage |
| Routing | Config-based (`src/app/app.routes.ts`), lazy-loaded, `authGuard` on protected routes |
| i18n | `@ngx-translate/core` ^18, default language `es` |
| Test framework | Jasmine 5 + Karma 6 (`npm run test:headless` for CI) |
| Static analysis | TypeScript strict only (`npx tsc --noEmit`) — no ESLint |
| SSR | `@angular/ssr` — built `server.mjs` loaded by Express at runtime |

---

## Layer Diagram

```
Browser / SSR request
        │
        ▼
Express BFF (server.js, port 4000)
  ├── /api/v1/session      → session.routes.js
  ├── /api/v1/users        → users.routes.js
  ├── /api/v1/roles        → roles.routes.js
  ├── /api/v1/features     → features.routes.js
  ├── /api/v1/people       → people.routes.js
  ├── /api/v1/contacts     → contacts.routes.js
  ├── /api/v1/iam/audit    → audit.routes.js
  │   (all delegate to proxyToBackbone → backbone-rest:8443)
  └── * → Angular SSR (dist/front-backbone-rest/server/server.mjs)
             │
             ▼
        Angular Router (app.routes.ts)
          ├── /auth/**      → features/auth/ (public)
          ├── /dashboard    → features/dashboard/
          ├── /users        → features/users/
          ├── /roles        → features/roles/
          ├── /people       → features/people/
          ├── /contacts     → features/contacts/
          ├── /features-mgmt → features/features-mgmt/
          ├── /audit        → features/audit/
          └── /forbidden    → features/forbidden/ (public)
```

---

## Quick Start

### Implement a full new entity end-to-end
```
/full-feature-delivery document /api/v1/documents "GET list, GET by id, POST, PUT, DELETE"
```

### Add a single UI component
```
/implement-component RoleBadge role-badge src/app/features/roles/role-badge "Display role name as colored badge"
```

### Run the quality gate manually
```bash
npm run build:ssr && npm run test:headless && npx tsc --noEmit
```

### Review all changed files before committing
```
/review-code
```

### Security audit before release
```
/security-audit full
```

---

## Index

| Resource | File |
|----------|------|
| Agents | [agents.md](agents.md) |
| Commands (slash commands) | [commands.md](commands.md) |
| Tools | [tools.md](tools.md) |
| Skills | [skills.md](skills.md) |
| Hooks | [settings.json](settings.json) — PostToolUse (tsc check), PreToolUse (HttpClient guard), Stop (checklist) |

---

## Pending Modules (from `docs/youtrack-issues.md`)

| Module | YouTrack | Status |
|--------|----------|--------|
| Shared components (ConfirmDialog + Toast) | STR-01 | ❌ Pending |
| Contact Types CRUD | STR-02 | ❌ Pending |
| Roles create/edit forms | STR-03 | ❌ Pending |
| Features create/edit forms + bug fix | STR-04 | ❌ Pending |
| Users full CRUD + role management | STR-05 | ❌ Pending |
| Applications create module | STR-06 | ❌ Pending |
| Managed Clients (M2M OAuth2) | STR-07 | ❌ Pending |
| Dashboard navigation update | STR-08 | ❌ Pending |
