# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is
Angular 20 + Express.js BFF frontend for the backbone-rest backoffice API.
Manages users, roles, people, contacts, features, and audit events via a
proxy layer over `https://backbone:8443/api/v1/`.

## Stack
| Layer | Tech |
|-------|------|
| Framework | Angular 20 (standalone components, new control flow) |
| State | NgRx 20 (global) + Signals (local) |
| Styling | Tailwind CSS v4 |
| BFF | Express.js (`server.js` + `server/`) |
| Session | Redis with in-memory fallback |
| Auth | Session JWT via `session-token` header |
| i18n | `@ngx-translate` — default language `es` |
| Language | TypeScript 5.9 strict mode |

## Build & Run

```bash
npm run build:ssr          # build Angular + SSR (production)
npm run serve:ssr          # start Express BFF on :4000 (serves built app)
npm run dev                # watch + serve concurrently (dev)
npm run start              # Angular dev server only on :4200 (no BFF)
npm test                   # unit tests (Karma, interactive)
npm run test:headless      # unit tests (ChromeHeadlessNoSandbox, CI-friendly)
```

## Environment Variables (BFF)
Configured in `server/config/constants.js`. All have defaults for local dev:
- `BACKBONE_BASE_URL` — upstream API (default: `http://localhost:8443`)
- `PORT` — BFF port (default: `4000`)
- `NODE_ENV` — `development` or `production`
- `CORS_ORIGIN` — CORS allow-list (default: `*`)
- `REDIS_URL` — Redis connection (default: `redis://localhost:6379`)

Angular environment config lives in `src/environments/environment.ts` — `apiBaseUrl` defaults to `/api`, which the BFF serves.

## Path Aliases
```
@app/*    → src/app/*
@core/*   → src/app/core/*
@shared/* → src/app/shared/*
@env/*    → src/environments/*
```

## Architecture

```
src/app/
├── core/
│   ├── guards/          auth.guard.ts — uses SessionStoreService.isAuthenticated$
│   ├── interceptors/    auth (injects session-token header from storage)
│   │                    error (401→/auth/login, 403→/forbidden)
│   │                    loading
│   ├── services/        http · auth · user · role · person · contact · feature · audit · loading · storage-mock
│   └── store/session/   actions · reducer · selectors · effects · store.service
├── features/
│   ├── auth/            login/ · register/ (lazy-loaded via authRoutes)
│   ├── dashboard/
│   ├── users/           users-list/ (lazy-loaded)
│   ├── roles/
│   ├── people/
│   ├── contacts/
│   ├── features-mgmt/
│   ├── audit/
│   └── forbidden/
└── shared/
    ├── constants/       api.constants.ts — all API path strings + SESSION_TOKEN_HEADER
    └── models/          session · user · role · person · contact · feature · application · audit

server/
├── config/             constants.js · logger.js (Winston)
├── routes/             session · users · roles · features · people · contacts · audit
└── shared/             proxy.js · redis-session-store.js
```

### Key patterns

**NgRx session store** — `SessionStoreService` (`core/store/session/session.store.service.ts`) is the only facade for session state. Guards and components inject it instead of the raw store. Effects persist/clear tokens to `StorageMockService` on `saveSession`/`clearSession` actions.

**HttpService** — thin wrapper around `HttpClient` (`core/services/http.service.ts`). Prefixes all paths with `environment.apiBaseUrl`. GET requests automatically retry once. All feature services must use this instead of `HttpClient` directly.

**BFF proxy** — `server/shared/proxy.js` contains `proxyToBackbone(req, res, backendPath)`. All route files in `server/routes/` delegate to it immediately — no logic in route handlers.

**SSR** — app is rendered server-side via `@angular/ssr`. The Express server (`server.js`) imports the built `server.mjs` at runtime. The `StorageMockService` abstracts `localStorage`/`window` for SSR safety.

## Prettier Config
`printWidth: 100`, `singleQuote: true`, Angular parser for HTML.

## Mandatory Conventions
1. **Standalone components only** — `standalone: true` always.
2. **`inject()` function** — no constructor injection except where required by inheritance.
3. **New control flow** — `@if`, `@for`, `@let`; never `*ngIf` / `*ngFor`.
4. **HttpService only** — never call `HttpClient` directly in components or feature services.
5. **NgRx for global state** — signals for local component state.
6. **No hardcoded URLs** — use `API` constants from `@shared/constants/api.constants`.
7. **SSR safety** — protect `localStorage` / `window` with `StorageMockService` or `isPlatformBrowser`.
8. **No comments** unless the WHY is non-obvious.

## backbone-rest API Base
All endpoints proxy to `BACKBONE_BASE_URL/api/v1/*`.
Session token travels in the `session-token` header (not `Authorization`).
Public endpoints (no token required):
- `POST /api/v1/session`
- `POST /api/v1/session/token`
- `GET  /api/v1/session/validate`
- `GET  /api/v1/session/renew`
- `POST /api/v1/session/refresh`

## What Not To Do
- Do NOT use `*ngIf` / `*ngFor` — use `@if` / `@for`.
- Do NOT inject `HttpClient` in components or feature services.
- Do NOT access `localStorage` directly — use `StorageMockService`.
- Do NOT add logic to route handlers in `server/routes/` — delegate to `shared/proxy.js`.
- Do NOT commit `.env` files with real secrets.
