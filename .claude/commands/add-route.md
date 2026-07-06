# Add Route

Add a new lazy-loaded, auth-guarded route to the Angular config-based router.

**Usage:** `/add-route <routePath> <componentClass> <componentFilePath> <routeType>`

Example: `/add-route documents DocumentsListComponent src/app/features/documents/documents-list/documents-list.component feature`

---

Agent: developer

## Inputs (from $ARGUMENTS)

Parse from $ARGUMENTS:
- `routePath` — kebab-case URL segment (e.g. `documents`)
- `componentClass` — PascalCase component class (e.g. `DocumentsListComponent`)
- `componentFilePath` — full path to component file
- `routeType` — `page` (single component) or `feature` (nested routes with child route file)

## Step 1 — Read the Router

Read `src/app/app.routes.ts` in full before editing.

## Step 2a — Feature with Nested Routes (`routeType = feature`)

Create `src/app/features/<routePath>/<routePath>.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const <routePath>Routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./<routePath>-list/<routePath>-list.component')
        .then((m) => m.<componentClass>),
  },
  // add child routes here as needed
];
```

Add to `src/app/app.routes.ts` before `{ path: '**', redirectTo: 'dashboard' }`:

```typescript
{
  path: '<routePath>',
  canActivate: [authGuard],
  loadChildren: () =>
    import('./features/<routePath>/<routePath>.routes')
      .then((m) => m.<routePath>Routes),
},
```

## Step 2b — Single Page (`routeType = page`)

Add directly to `src/app/app.routes.ts`:

```typescript
{
  path: '<routePath>',
  canActivate: [authGuard],
  loadComponent: () =>
    import('<componentFilePath>').then((m) => m.<componentClass>),
},
```

## Step 3 — Verify

```bash
npx tsc --noEmit
npm run build:ssr
```

The route must not appear in any eager import. It must only exist in the `loadChildren` or
`loadComponent` callback.

## Constraints

- `canActivate: [authGuard]` is required for every route except `/auth/**` and `/forbidden`
- All routes must use `loadComponent` or `loadChildren` — never eager imports
- Route path must be `kebab-case`

## Output

- `src/app/app.routes.ts` — MODIFIED
- `src/app/features/<routePath>/<routePath>.routes.ts` — CREATED (if feature)
- Build: pass/fail
