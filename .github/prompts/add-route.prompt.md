---
name: Add Route
description: Adds a new lazy-loaded, auth-guarded route to the Angular config-based router in front-backbone-rest
mode: agent
agent: developer
tools: [run_in_terminal, read_file, grep_search, file_search, insert_edit_into_file, replace_string_in_file, create_file, get_errors]
---

# Add Route

Add a new route to front-backbone-rest's config-based Angular router.

- **Route path**: `${routePath}` (e.g. `documents`)
- **Target component**: `${componentClass}` in `${componentFilePath}`
- **Auth required**: `${authRequired}` (`yes` / `no`)
- **Route type**: `${routeType}` (`page` = single component / `feature` = nested routes)

---

## Step 1 — Read the Router

Read `src/app/app.routes.ts` in full before editing. Understand the existing route order.

---

## Step 2a — Feature with nested routes (`routeType = feature`)

Create `src/app/features/${routePath}/${routePath}.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const ${routePath}Routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./${routePath}-list/${routePath}-list.component')
        .then((m) => m.${componentClass}),
  },
  // add child routes here as needed
];
```

Add to `src/app/app.routes.ts` before `{ path: '**', redirectTo: 'dashboard' }`:

```typescript
{
  path: '${routePath}',
  canActivate: [authGuard],   // include if authRequired === 'yes'
  loadChildren: () =>
    import('./features/${routePath}/${routePath}.routes')
      .then((m) => m.${routePath}Routes),
},
```

---

## Step 2b — Single page (`routeType = page`)

Add directly to `src/app/app.routes.ts`:

```typescript
{
  path: '${routePath}',
  canActivate: [authGuard],   // include if authRequired === 'yes'
  loadComponent: () =>
    import('${componentFilePath}').then((m) => m.${componentClass}),
},
```

---

## Step 3 — Verify

```bash
npx tsc --noEmit
npm run build:ssr
```

The route must not appear in any eager import. It must only exist in the `loadChildren`
or `loadComponent` callback.

---

## Constraints

- `canActivate: [authGuard]` is required for every route except `/auth/**` and `/forbidden`
- All routes must use `loadComponent` or `loadChildren` — never eager imports
- Do not add `authGuard` to `/auth/**` or `/forbidden` (they must remain public)
- Route path must be `kebab-case`

## Output

- File modified: `src/app/app.routes.ts` — MODIFIED
- File created (if feature): `src/app/features/${routePath}/${routePath}.routes.ts` — CREATED
- Build: pass/fail
