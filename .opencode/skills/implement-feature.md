# Implement Feature

## When to use
When adding a new managed entity (e.g., `document`, `notification`) end-to-end: BFF proxy routes, Angular service, API constants, and a list component.

## Steps

### 1. Add API constants
File: `src/app/shared/constants/api.constants.ts`

Add a new entry to the `API` object. Static paths are string literals; dynamic paths are arrow functions. All paths start with `/v1/` (never `/api/v1/`).

```typescript
ENTITY: {
  ROOT: '/v1/<entity>',
  BY_ID: (id: string) => `/v1/<entity>/${id}`,
},
```

### 2. Add the TypeScript model
File: `src/app/shared/models/<entity>.model.ts`

Define the interface (no classes). Match the field names returned by backbone-rest.

```typescript
export interface EntityTO {
  id: string;
  name: string;
  active: boolean;
}

export interface EntityCreateRequest {
  name: string;
}
```

### 3. Add the Angular feature service
File: `src/app/core/services/<entity>.service.ts`

```typescript
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { EntityTO, EntityCreateRequest } from '@shared/models/<entity>.model';

@Injectable({ providedIn: 'root' })
export class EntityService {
  private readonly http = inject(HttpService);

  getAll(): Observable<EntityTO[]> {
    return this.http.get<EntityTO[]>(API.ENTITY.ROOT);
  }

  getById(id: string): Observable<EntityTO> {
    return this.http.get<EntityTO>(API.ENTITY.BY_ID(id));
  }

  create(req: EntityCreateRequest): Observable<EntityTO> {
    return this.http.post<EntityTO>(API.ENTITY.ROOT, req);
  }
}
```

### 4. Add the BFF proxy route file
File: `server/routes/<entity>.routes.js`

Each handler is a one-liner. No logic.

```javascript
'use strict';
const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');
const router = Router();

router.get('/', (req, res) => proxyToBackbone(req, res, '/api/v1/<entity>'));
router.get('/:id', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/<entity>/${req.params['id']}`)
);
router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/<entity>'));
router.put('/:id', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/<entity>/${req.params['id']}`)
);
router.delete('/:id', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/<entity>/${req.params['id']}`)
);

module.exports = router;
```

### 5. Register the route in the BFF entry point
File: `server.js`

Add after the existing `require` block and `app.use` block:

```javascript
const entityRoutes = require('./server/routes/<entity>.routes');
// ...
app.use('/api/v1/<entity>', entityRoutes);
```

### 6. Add the Angular feature route
File: `src/app/features/<entity>/<entity>.routes.ts`

```typescript
import { Routes } from '@angular/router';

export const entityRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./<entity>-list/<entity>-list.component').then((m) => m.EntityListComponent),
  },
];
```

Register in `src/app/app.routes.ts`:
```typescript
{
  path: '<entity>',
  canActivate: [authGuard],
  loadChildren: () =>
    import('./features/<entity>/<entity>.routes').then((m) => m.entityRoutes),
},
```

### 7. Add the list component
File: `src/app/features/<entity>/<entity>-list/<entity>-list.component.ts`

Use the `UsersListComponent` in `src/app/features/users/users-list/users-list.component.ts` as the canonical pattern:
- `standalone: true`
- `inject()` for the service
- `signal<EntityTO[]>([])`, `signal(true)` for loading, `signal<string | null>(null)` for error
- `@if (loading())` / `@else` / `@for (item of items(); track item.id)` / `@empty`
- Inline template

### 8. Write the spec file
File: `src/app/core/services/<entity>.service.spec.ts`

See `tester` agent for the service test pattern. Mock `HttpService` with `jasmine.createSpyObj`.

## Checklist

- [ ] `API.ENTITY` constants added with `/v1/` prefix
- [ ] Model interface in `src/app/shared/models/<entity>.model.ts`
- [ ] Service in `src/app/core/services/<entity>.service.ts` uses `inject(HttpService)` only
- [ ] BFF route file has one-liner handlers calling `proxyToBackbone()`
- [ ] Route registered in `server.js` at `/api/v1/<entity>`
- [ ] Feature route lazy-loads with `loadComponent` / `loadChildren`
- [ ] `canActivate: [authGuard]` on the app route
- [ ] Component is `standalone: true` with inline template and signals
- [ ] Spec file written and `npm run test:headless` passes
- [ ] `npm run build:ssr` passes
- [ ] `npx tsc --noEmit` passes
