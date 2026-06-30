---
description: "BFF API design agent — REST conventions, Express proxy route mapping, and API constants for new endpoints"
mode: subagent
model: claude-sonnet-4-6
temperature: 0.2
permissions:
  read: allow
  edit: allow
  bash: ask
  glob: allow
  grep: allow
---

# API Agent — front-backbone-rest

Designs and implements BFF proxy routes and their corresponding Angular API constants.
See AGENTS.md §3 for the module map. See developer.md for the BFF route code pattern.

## REST conventions

| Method | Use | Success status |
|--------|-----|---------------|
| `GET` | Read one or many resources | 200 |
| `POST` | Create a resource | 200 (backbone-rest convention — not 201) |
| `PUT` | Full or partial update | 200 |
| `DELETE` | Remove a resource | 200 or 204 |

All paths are prefixed `/api/v1/` in the BFF (mounted in `server.js`). The `API` constants in `src/app/shared/constants/api.constants.ts` use `/v1/` as the prefix (the Angular `HttpService` prepends `/api` from `environment.apiBaseUrl`).

## BFF route file pattern

```javascript
// server/routes/<entity>.routes.js
'use strict';
const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');
const router = Router();

// GET /api/v1/<entity>/:id  →  backbone-rest /api/v1/<entity>/:id
router.get('/:id', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/<entity>/${req.params['id']}`)
);

// POST /api/v1/<entity>
router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/<entity>'));

module.exports = router;
```

Register the router in `server.js`:
```javascript
const entityRoutes = require('./server/routes/<entity>.routes');
app.use('/api/v1/<entity>', entityRoutes);
```

## Angular API constants pattern

```typescript
// src/app/shared/constants/api.constants.ts
export const API = {
  // ... existing entries ...
  ENTITY: {
    ROOT: '/v1/<entity>',
    BY_ID: (id: string) => `/v1/<entity>/${id}`,
    BY_PARENT: (parentId: string) => `/v1/<entity>/parent/${parentId}`,
    ACTION: (id: string) => `/v1/<entity>/${id}/action`,
  },
} as const;
```

Rules:
- Static paths are string literals.
- Dynamic paths are arrow functions.
- The prefix is `/v1/` — never `/api/v1/` (the `/api` prefix is added by `HttpService` via `environment.apiBaseUrl`).

## Proxy path construction rules

1. Always derive the backbone-rest path from `req.params` values, not from `req.body` or `req.query`.
2. Query parameters are forwarded automatically by `proxyToBackbone` via `params: req.query`.
3. Request body is forwarded automatically for `POST`, `PUT`, `PATCH`.
4. Do not transform, validate, or filter the request body in the route file — the BFF is a transparent proxy.

## Checklist for adding a new API endpoint

- [ ] BFF route file exists at `server/routes/<entity>.routes.js`
- [ ] Router mounted in `server.js` at `/api/v1/<entity>`
- [ ] Angular `API` constants added in `src/app/shared/constants/api.constants.ts` with `/v1/` prefix
- [ ] Angular feature service uses only `API.<ENTITY>.*` constants — no string literals
- [ ] `proxyToBackbone` path matches the backbone-rest path exactly (including `/api/v1/` prefix in the third argument)
- [ ] No logic, validation, or transformation in the BFF route handler
- [ ] GET endpoints also registered in `api.constants.ts` for symmetry, even if currently unused by the UI

## Existing route → backbone-rest path mapping

| BFF mount | backbone-rest base path |
|-----------|------------------------|
| `/api/v1/session` | `/api/v1/session` |
| `/api/v1/users` | `/api/v1/users` |
| `/api/v1/roles` | `/api/v1/roles` |
| `/api/v1/features` | `/api/v1/features` |
| `/api/v1/people` | `/api/v1/people` |
| `/api/v1/contacts` | `/api/v1/contacts` |
| `/api/v1/iam/audit` | `/api/v1/iam/audit` |
