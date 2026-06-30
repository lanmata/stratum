---
name: Bundle Analyzer
description: Tool for checking Angular 20 bundle budgets and chunk sizes in front-backbone-rest via @angular/build output
type: terminal
command-prefix: npm run build:ssr
used-by: [Code Reviewer, Developer]
---

# Bundle Analyzer

## Purpose
Monitors Angular production bundle sizes using the `@angular/build` budget feature
configured in `angular.json`. No external bundle-analyzer package is installed —
budget violations are surfaced directly by the Angular build.

## Available Commands

### Check bundle sizes (production build with budget enforcement)
```bash
# Budgets are enforced automatically in the production build
npm run build:ssr

# Inspect generated chunks after build
ls -lh dist/front-backbone-rest/browser/*.js 2>/dev/null | sort -k5 -rh | head -20
```

### Analyse SSR bundle
```bash
ls -lh dist/front-backbone-rest/server/server.mjs
```

## Budget Thresholds (`angular.json`)

| Bundle type | Warning | Error (blocks build) |
|-------------|---------|---------------------|
| Initial (main + polyfills) | 500 kB | 1 MB |
| Any component style | 4 kB | 8 kB |

Feature chunks loaded via `loadChildren` / `loadComponent` are **not** counted toward the
initial bundle — they are separate chunks downloaded on demand.

## What Increases the Initial Bundle

- New imports added to `src/app/app.config.ts` providers
- New entries added to `src/main.ts`
- Removing `loadComponent` / `loadChildren` lazy loading (converting to eager import)
- Adding large third-party libraries without tree-shaking

## What Does NOT Increase the Initial Bundle

- New lazy-loaded feature components under `src/app/features/`
- New injectable services with `providedIn: 'root'` (tree-shaken if unused)
- New entries in `src/app/shared/constants/` or `src/app/shared/models/`

## Notes

- There is no `webpack-bundle-analyzer` or `source-map-explorer` installed.
- For deeper analysis, add `"sourceMap": true` to `angular.json` development config and use browser DevTools.
- The code-reviewer agent should flag any change that adds a new eager import to `app.config.ts`.
