# Angular Build — Tool

Used by: Orchestrator, Developer, API Designer

## Purpose
Compiles the Angular 20 application with SSR support using `@angular/build:application`.

## Available Commands

```bash
# Production build (required before serve:ssr)
npm run build:ssr

# Development watch (rebuilds on change)
npm run watch:ssr

# Combined watch + BFF (recommended for development)
npm run dev
```

## Build Configuration

| Setting | Value |
|---------|-------|
| Builder | `@angular/build:application` |
| Browser entry | `src/main.ts` |
| Server entry | `src/main.server.ts` |
| SSR entry | `src/server.ts` |
| Output | `dist/front-backbone-rest/` |
| Default config | `production` |

## Production Budget Limits

| Type | Warning | Error |
|------|---------|-------|
| Initial bundle | 500 kB | 1 MB |
| Any component style | 4 kB | 8 kB |

If a budget error occurs, check for new imports in eagerly-loaded modules (`app.config.ts`, `src/main.ts`). Lazy-loaded features are separate chunks and don't count toward the initial budget.

## Output Locations

```
dist/front-backbone-rest/
├── browser/          ← static assets (JS, CSS, images)
│   └── index.html
└── server/
    └── server.mjs    ← SSR rendering bundle
```

## Notes

- After build, `npm run serve:ssr` starts the BFF which serves `dist/front-backbone-rest/browser/`.
- `outputHashing: 'all'` in production — all asset filenames include a content hash.
- `npm run dev` does not produce an optimised production build.
