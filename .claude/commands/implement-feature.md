# Implement Feature

Implement a new entity end-to-end in front-backbone-rest.

**Usage:** `/implement-feature <entityName> <backboneBasePath> <httpMethods>`

Example: `/implement-feature document /api/v1/documents "GET list, GET by id, POST, PUT, DELETE"`

---

Agent: developer

Read `.claude/skills/developer.skill.md`, `.claude/skills/api-contract.skill.md`, and `.claude/skills/bff-proxy.skill.md` before starting.

## Inputs (from $ARGUMENTS)

Parse the following from $ARGUMENTS:
- `entityName` — singular kebab-case (e.g. `document`)
- `backboneBasePath` — full path (e.g. `/api/v1/documents`)
- `httpMethods` — comma-separated list of needed HTTP methods

## Step 1 — API Constants

Add to `src/app/shared/constants/api.constants.ts` inside the `API` object:

```typescript
ENTITY_UPPER: {
  ROOT: '/v1/<entityPath>',
  BY_ID: (id: string) => `/v1/<entityPath>/${id}`,
  // add more paths as needed
},
```

Rules: `/v1/` prefix (not `/api/v1/`), `as const` stays at end of `API` object.

## Step 2 — TypeScript Model

Create `src/app/shared/models/<entityName>.model.ts`:

```typescript
export interface <EntityClass>TO {
  id: string;
  // add fields from backbone-rest response
}

export interface <EntityClass>CreateRequest {
  // fields required for POST
}
```

## Step 3 — Angular Service

Create `src/app/core/services/<entityName>.service.ts`:

```typescript
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { <EntityClass>TO } from '@shared/models/<entityName>.model';

@Injectable({ providedIn: 'root' })
export class <EntityClass>Service {
  private readonly http = inject(HttpService);

  getAll(): Observable<<EntityClass>TO[]> {
    return this.http.get<<EntityClass>TO[]>(API.ENTITY_UPPER.ROOT);
  }

  getById(id: string): Observable<<EntityClass>TO> {
    return this.http.get<<EntityClass>TO>(API.ENTITY_UPPER.BY_ID(id));
  }
}
```

## Step 4 — BFF Proxy Route

Create `server/routes/<entityName>.routes.js`:

```javascript
'use strict';
const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');
const router = Router();

// one handler per HTTP method needed
router.get('/', (req, res) => proxyToBackbone(req, res, '<backboneBasePath>'));
router.get('/:id', (req, res) =>
  proxyToBackbone(req, res, `<backboneBasePath>/${req.params['id']}`)
);
router.post('/', (req, res) => proxyToBackbone(req, res, '<backboneBasePath>'));
router.put('/:id', (req, res) =>
  proxyToBackbone(req, res, `<backboneBasePath>/${req.params['id']}`)
);
router.delete('/:id', (req, res) =>
  proxyToBackbone(req, res, `<backboneBasePath>/${req.params['id']}`)
);

module.exports = router;
```

Register in `server.js` before `app.get('*splat', ...)`:

```javascript
const <entityName>Routes = require('./server/routes/<entityName>.routes');
app.use('/api/v1/<entityPath>', <entityName>Routes);
```

## Step 5 — Feature Route

Create `src/app/features/<entityName>/<entityName>.routes.ts`:

```typescript
import { Routes } from '@angular/router';
export const <entityName>Routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./<entityName>-list/<entityName>-list.component')
        .then((m) => m.<EntityClass>ListComponent),
  },
];
```

Add to `src/app/app.routes.ts` before the `**` catch-all:

```typescript
{
  path: '<entityPath>',
  canActivate: [authGuard],
  loadChildren: () =>
    import('./features/<entityName>/<entityName>.routes')
      .then((m) => m.<entityName>Routes),
},
```

## Step 6 — List Component

Create `src/app/features/<entityName>/<entityName>-list/<entityName>-list.component.ts`.

Required: `standalone: true`, `inject()`, signals for `items`/`loading`/`error`, inline template,
`@if`/`@for`/`@empty`, Tailwind classes. No separate `.html` file.

Reference: `src/app/features/users/users-list/users-list.component.ts`.

## Constraints

- Never hardcode URL strings — use `API.<ENTITY_UPPER>.*` constants
- BFF route handlers are one-liners — no logic
- `StorageMockService` instead of direct `localStorage`
- `standalone: true`, `inject()`, `signal()` — no exceptions

## End-of-task Checklist

- [ ] `npm run build:ssr` passes
- [ ] `npm run test:headless` passes
- [ ] `npx tsc --noEmit` passes
- [ ] BFF route registered in `server.js` before SSR catch-all
- [ ] New app route has `canActivate: [authGuard]`

## Output

List each file with status: CREATED / MODIFIED. State quality gate results.
