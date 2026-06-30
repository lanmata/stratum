# AGENTS.md — front-backbone-rest

Loaded into every agent's context. Cross-reference sections rather than duplicating content.

---

## 1. Runtime & Stack

| Component | Version |
|-----------|---------|
| Framework | Angular 20.3 (standalone, SSR via `@angular/ssr`) |
| Language  | TypeScript 5.9, strict mode |
| State     | NgRx 20 (session only) + Angular Signals (local) |
| Styling   | Tailwind CSS v4 |
| i18n      | `@ngx-translate/core` 16, default language `es` |
| BFF       | Express.js 5.2, Node.js |
| HTTP client (BFF) | axios 1.x |
| Session store | Redis 6 with in-memory fallback |
| Test runner | Karma 6 + Jasmine 5 |
| Package manager | npm |

---

## 2. Architecture

```
Browser / SSR
     │
     ▼
Angular Component
  (signals for local state, inject() for DI)
     │
     ▼
Feature Service
  (inject HttpService, use API constants)
     │
     ▼
HttpService  ──── authInterceptor (session-token header)
  (wraps HttpClient, prefixes /api)
     │
     ▼  HTTP (same host)
Express BFF  (server.js + server/routes/*.js)
     │
     ▼  proxyToBackbone()  — server/shared/proxy.js
backbone-rest API  (BACKBONE_BASE_URL/api/v1/*)
```

NgRx session store (side-channel, not in the request path):
```
Component / Guard
     │
     ▼
SessionStoreService  ──▶  Store.dispatch()  ──▶  sessionReducer
     │                                                │
     ▼                                          SessionEffects
  Store.select()           (persist token to StorageMockService)
```

---

## 3. Package / Module Map

| Path | Purpose |
|------|---------|
| `src/app/core/guards/` | Route guards (`authGuard` — checks `isAuthenticated$`) |
| `src/app/core/interceptors/` | HTTP interceptors: auth (injects token), error (401/403 redirects), loading |
| `src/app/core/services/` | Domain services: `AuthService`, `UserService`, `RoleService`, `PersonService`, `ContactService`, `FeatureService`, `AuditService`, `LoadingService`, `StorageMockService`, `HttpService` |
| `src/app/core/store/session/` | NgRx slice: actions, reducer, selectors, effects, `SessionStoreService` facade |
| `src/app/features/` | Lazy-loaded feature modules: auth, dashboard, users, roles, people, contacts, features-mgmt, audit, forbidden |
| `src/app/shared/constants/` | `api.constants.ts` — typed `API` object + `SESSION_TOKEN_HEADER` |
| `src/app/shared/models/` | TypeScript interfaces: session, user, role, person, contact, feature, application, audit |
| `src/environments/` | Angular build-time config (`apiBaseUrl`, `appName`, `defaultLanguage`) |
| `server/config/` | BFF constants (env-vars + defaults), Winston logger |
| `server/routes/` | Express route files — one-liner `proxyToBackbone()` calls only |
| `server/shared/proxy.js` | `proxyToBackbone(req, res, backendPath)` — the single proxy utility |
| `server/shared/redis-session-store.js` | Redis session store with in-memory fallback |

---

## 4. Messaging

Not applicable — this project has no message broker.

---

## 5. Persistence

| Store | Purpose | Notes |
|-------|---------|-------|
| Redis | Session token cache | `REDIS_URL` env-var; falls back to in-memory if unavailable |

No SQL database, no ORM, no migrations.

---

## 6. Key Conventions

- **Standalone only** — every component has `standalone: true`. No NgModules.
- **`inject()` everywhere** — no constructor injection except where Angular requires inheritance.
- **New control flow** — `@if`, `@for`, `@let`, `@empty`; never `*ngIf` / `*ngFor`.
- **`HttpService` only** — components and feature services never import `HttpClient` directly.
- **Signals for local state** — `protected readonly x = signal<T>(initial)` in components; NgRx only for session.
- **API constants** — all paths in `API` object (`@shared/constants/api.constants.ts`); no hardcoded URL strings.
- **SSR safety** — access `localStorage`/`window` only via `StorageMockService` or guarded with `isPlatformBrowser`.
- **Inline templates** — components embed the template string directly; no separate `.html` file.
- **Lazy loading** — all routes use `loadComponent` or `loadChildren`; never eager import in `app.routes.ts`.
- **BFF route rule** — each `server/routes/*.js` handler is a one-liner calling `proxyToBackbone()`. No logic in routes.
- **No comments** unless the WHY is non-obvious.
- **Prettier** — `printWidth: 100`, `singleQuote: true`, Angular HTML parser for templates.
- **Winston log levels** — BFF uses `logger.debug/info/warn/error`. Production: JSON. Development: simple text.
- **i18n** — all user-visible strings go through `@ngx-translate` pipes or service; default locale `es`.

---

## 7. Build & Test Commands

| Task | Command |
|------|---------|
| Production build | `npm run build:ssr` |
| Dev (watch + BFF) | `npm run dev` |
| Start BFF only | `npm run serve:ssr` |
| Angular dev server | `npm run start` |
| Unit tests (interactive) | `npm test` |
| Unit tests (CI/headless) | `npm run test:headless` |
| Type check (no emit) | `npx tsc --noEmit` |

No lint script is configured. TypeScript strict mode is the static analysis gate.

---

## 8. External Dependencies

| Dependency | Notes |
|------------|-------|
| backbone-rest API | Upstream at `BACKBONE_BASE_URL` (default `http://localhost:8443`). All calls proxy through BFF. Never call from Angular directly. |
| Redis | Session store at `REDIS_URL` (default `redis://localhost:6379`). BFF falls back to in-memory if unavailable. |

---

## 9. Agents

| Name | Purpose | Mode | Model | Key MCPs |
|------|---------|------|-------|----------|
| `developer` | Primary coding agent | primary | claude-sonnet-4-6 | codegraph, fetch, memory |
| `reviewer` | Read-only code review | subagent | claude-opus-4-8 | codegraph, git |
| `tester` | Jasmine test authoring | subagent | claude-sonnet-4-6 | codegraph |
| `security` | OWASP audit (read-only) | subagent | claude-opus-4-8 | git |
| `api` | BFF route and API design | subagent | claude-sonnet-4-6 | codegraph, fetch |

### Keybindings

| Shortcut | Agent |
|----------|-------|
| `Ctrl+Shift+D` | developer |
| `Ctrl+Shift+R` | reviewer |
| `Ctrl+Shift+T` | tester |
| `Ctrl+Shift+S` | security |
| `Ctrl+Shift+A` | api |

---

## 10. MCPs

### Tier 1

| Name | Purpose | Required Env-Vars |
|------|---------|-------------------|
| `codegraph` | Symbol index, call graph, cross-file navigation | none |
| `git` | Git history, blame, diff queries | none |
| `github` | PR, issue, Actions API | `GITHUB_TOKEN` |

### Tier 2

| Name | Purpose | Required Env-Vars |
|------|---------|-------------------|
| `fetch` | Read external URLs (Angular docs, backbone-rest spec) | none |
| `memory` | Persist cross-session conventions and decisions | none |

### Usage Patterns by Agent Role

- **developer** — uses `codegraph` to locate callers before editing, `fetch` to read upstream API docs, `memory` to recall prior architectural decisions.
- **reviewer** — uses `codegraph` for impact analysis, `git` for blame and recent change context.
- **tester** — uses `codegraph` to find existing test patterns and the component/service under test.
- **security** — uses `git` for blame on sensitive files; does not write files.
- **api** — uses `codegraph` to find existing route and service patterns, `fetch` to read backbone-rest API spec.

---

## 11. Skills

| Skill | Trigger Phrase | Purpose |
|-------|---------------|---------|
| `implement-feature` | `/implement-feature` | End-to-end guide for adding a new entity (service, BFF routes, component) |
| `security-audit` | `/security-audit` | Structured grep-based security audit for Node.js + Angular stack |

Full prompts are in `.opencode/skills/implement-feature.md` and `.opencode/skills/security-audit.md`.

---

## 12. Hooks

| Hook | Trigger | What It Does |
|------|---------|-------------|
| `before-edit.sh` | Before any file is edited | Warns (exit 0) if target is in `dist/`, `node_modules/`, or is a sensitive config file |
| `after-session.sh` | After each OpenCode session | Prints the pre-commit checklist: build, test, type-check, secrets scan |

### `before-edit.sh` — detected patterns

- Build output: `dist/`
- Dependency directories: `node_modules/`
- Lock files: `package-lock.json`
- SSL/secrets: `ssl/`, `*.pem`, `*.key`, `*.p12`, `*.jks`
- TypeScript build output: `*.js.map` under `dist/`

### `after-session.sh` — checklist

1. `npm run build:ssr` — production build passes
2. `npm run test:headless` — all tests green
3. `npx tsc --noEmit` — no type errors
4. Grep for hardcoded secrets and tokens in new files
5. Verify no new env-vars are missing from `server/config/constants.js`
6. Confirm `StorageMockService` used instead of direct `localStorage` access

---

## 13. Tools

No database wrapper scripts are required — this project uses no SQL database. Redis is accessed via the BFF application code, not directly via MCP.

### Template: adding a new credential-bearing tool wrapper

```sh
#!/usr/bin/env sh
# .opencode/tools/<name>-mcp.sh
# Required env-vars:
#   MY_SERVICE_HOST — hostname of the service
#   MY_SERVICE_PORT — port (default: 5432)
#   MY_SERVICE_USER — username
#   MY_SERVICE_PASSWORD — password

: "${MY_SERVICE_HOST:?MY_SERVICE_HOST is not set}"
: "${MY_SERVICE_USER:?MY_SERVICE_USER is not set}"
: "${MY_SERVICE_PASSWORD:?MY_SERVICE_PASSWORD is not set}"
MY_SERVICE_PORT="${MY_SERVICE_PORT:-5432}"

exec npx -y @modelcontextprotocol/server-<name> \
  "host=${MY_SERVICE_HOST} port=${MY_SERVICE_PORT} user=${MY_SERVICE_USER} password=${MY_SERVICE_PASSWORD}"
```
