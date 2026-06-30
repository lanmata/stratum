---
name: Implement Feature
description: End-to-end implementation of a new managed entity in front-backbone-rest — API constants, TypeScript model, Angular service, BFF route, lazy-loaded component, and route registration
mode: agent
agent: developer
tools: [run_in_terminal, read_file, grep_search, file_search, insert_edit_into_file, replace_string_in_file, create_file, get_errors]
---

# Implement Feature

Implement the entity **`${entityName}`** end-to-end in front-backbone-rest.
backbone-rest base path: **`${backboneBasePath}`** (e.g. `/api/v1/documents`)
HTTP methods needed: **`${httpMethods}`** (e.g. `GET list, GET by id, POST, PUT, DELETE`)

---

## Step 1 — API Constants

Add to `src/app/shared/constants/api.constants.ts` inside the `API` object:

```typescript
${ENTITY_UPPER}: {
  ROOT: '/v1/${entityPath}',
  BY_ID: (id: string) => `/v1/${entityPath}/${id}`,
  // add more paths as needed for ${httpMethods}
},
```

Rules: `/v1/` prefix (not `/api/v1/`), `as const` stays at end of `API` object.

---

## Step 2 — TypeScript Model

Create `src/app/shared/models/${entityName}.model.ts`:

```typescript
export interface ${EntityClass}TO {
  id: string;
  // add fields from backbone-rest response
}

export interface ${EntityClass}CreateRequest {
  // fields required for POST
}
```

---

## Step 3 — Angular Service

Create `src/app/core/services/${entityName}.service.ts`:

```typescript
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { ${EntityClass}TO, ${EntityClass}CreateRequest } from '@shared/models/${entityName}.model';

@Injectable({ providedIn: 'root' })
export class ${EntityClass}Service {
  private readonly http = inject(HttpService);

  // add one method per HTTP method in ${httpMethods}
  getAll(): Observable<${EntityClass}TO[]> {
    return this.http.get<${EntityClass}TO[]>(API.${ENTITY_UPPER}.ROOT);
  }

  getById(id: string): Observable<${EntityClass}TO> {
    return this.http.get<${EntityClass}TO>(API.${ENTITY_UPPER}.BY_ID(id));
  }

  create(req: ${EntityClass}CreateRequest): Observable<${EntityClass}TO> {
    return this.http.post<${EntityClass}TO>(API.${ENTITY_UPPER}.ROOT, req);
  }
}
```

---

## Step 4 — BFF Proxy Route

Create `server/routes/${entityName}.routes.js`:

```javascript
'use strict';
const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');
const router = Router();

// Add one handler per method in ${httpMethods}
router.get('/', (req, res) => proxyToBackbone(req, res, '${backboneBasePath}'));
router.get('/:id', (req, res) =>
  proxyToBackbone(req, res, `${backboneBasePath}/${req.params['id']}`)
);
router.post('/', (req, res) => proxyToBackbone(req, res, '${backboneBasePath}'));
router.put('/:id', (req, res) =>
  proxyToBackbone(req, res, `${backboneBasePath}/${req.params['id']}`)
);
router.delete('/:id', (req, res) =>
  proxyToBackbone(req, res, `${backboneBasePath}/${req.params['id']}`)
);

module.exports = router;
```

Register in `server.js` (before the SSR catch-all `app.get('*splat', ...)`):

```javascript
const ${entityName}Routes = require('./server/routes/${entityName}.routes');
app.use('/api/v1/${entityPath}', ${entityName}Routes);
```

---

## Step 5 — Angular Feature Route

Create `src/app/features/${entityName}/${entityName}.routes.ts`:

```typescript
import { Routes } from '@angular/router';
export const ${entityName}Routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./${entityName}-list/${entityName}-list.component')
        .then((m) => m.${EntityClass}ListComponent),
  },
];
```

Add to `src/app/app.routes.ts` (before the `{ path: '**', redirectTo: 'dashboard' }` catch-all):

```typescript
{
  path: '${entityPath}',
  canActivate: [authGuard],
  loadChildren: () =>
    import('./features/${entityName}/${entityName}.routes')
      .then((m) => m.${entityName}Routes),
},
```

---

## Step 6 — List Component

Create `src/app/features/${entityName}/${entityName}-list/${entityName}-list.component.ts`.

Model: standalone, `inject()`, signals for `items`, `loading`, `error`. Inline template.
Use `@if` / `@for` / `@empty`. Tailwind utility classes. No separate `.html` file.
Reference: `src/app/features/users/users-list/users-list.component.ts`.

---

## Constraints

- Never hardcode URL strings — use `API.${ENTITY_UPPER}.*` constants
- BFF route handlers are one-liners — no logic
- `StorageMockService` instead of direct `localStorage`
- `standalone: true`, `inject()`, `signal()` — no exceptions

## End-of-task Checklist

- [ ] `npm run build:ssr` passes
- [ ] `npm run test:headless` passes
- [ ] `npx tsc --noEmit` passes
- [ ] BFF route registered in `server.js` before SSR catch-all
- [ ] New app route has `canActivate: [authGuard]`
- [ ] Service spec file created (or delegate to test-writer)

## Output

List each file with status: CREATED / MODIFIED.
State quality gate results.
