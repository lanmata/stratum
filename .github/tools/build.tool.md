---
name: Angular Build
description: Tool for building the Angular 20 SSR application via @angular/build in front-backbone-rest
type: terminal
command-prefix: npm run build:ssr
used-by: [Orchestrator, Developer, API Designer]
---

# Angular Build

## Purpose
Compiles the Angular 20 application with SSR support using `@angular/build:application`.
The production build is required before starting the Express BFF with SSR rendering.

## Available Commands

### Production build (required before `serve:ssr`)
```bash
npm run build:ssr
# Equivalent: ng build --configuration production
```

### Development watch (rebuilds on change, no SSR optimisation)
```bash
npm run watch:ssr
# Equivalent: ng build --watch --configuration development
```

## Build Configuration (`angular.json`)

| Setting | Value |
|---------|-------|
| Builder | `@angular/build:application` |
| Browser entry | `src/main.ts` |
| Server entry | `src/main.server.ts` |
| SSR entry | `src/server.ts` |
| Output | `dist/front-backbone-rest/` |
| Default config | `production` |

## Production Budget Limits

Enforced by `@angular/build` — violations cause build failure:

| Type | Warning | Error |
|------|---------|-------|
| Initial bundle | 500 kB | 1 MB |
| Any component style | 4 kB | 8 kB |

If the build reports a budget error, investigate new imports added to eagerly-loaded
modules (anything in `app.config.ts` providers or `src/main.ts`). Feature modules loaded
via `loadChildren` are separate chunks and do not count toward the initial budget.

## Output Locations

```
dist/front-backbone-rest/
├── browser/          ← static assets served by Express (JS, CSS, images)
│   └── index.html    ← shell HTML
└── server/
    └── server.mjs    ← SSR rendering bundle (imported by server.js at runtime)
```

## Notes

- `npm run build:ssr` uses the `production` configuration by default.
- `npm run dev` (watch + BFF) does not produce a production-optimised build — do not use for testing SSR behaviour.
- After build, `npm run serve:ssr` starts the Express BFF which serves `dist/front-backbone-rest/browser/` and uses `server.mjs` for SSR.
- `outputHashing: 'all'` is enabled in production — all asset filenames include a content hash.
