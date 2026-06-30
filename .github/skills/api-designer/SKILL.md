---
name: API Designer Skills
description: Express 5 BFF proxy route and Angular API constant patterns for front-backbone-rest
applies-to: [API Designer]
---

# API Designer — Skill Definition

## 1. BFF Route Pattern (from `server/routes/users.routes.js`)

```javascript
// server/routes/<entity>.routes.js
'use strict';
const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');
const router = Router();

// Static path
router.get('/', (req, res) => proxyToBackbone(req, res, '/api/v1/<entity>'));

// Dynamic path — bracket notation for params
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

## 2. Router Registration in `server.js`

Add **before** the Angular SSR catch-all handler (`app.get('*splat', ...)`):

```javascript
const <entity>Routes = require('./server/routes/<entity>.routes');
// ...
app.use('/api/v1/<entity>', <entity>Routes);
```

## 3. Angular API Constant Pattern (from `api.constants.ts`)

```typescript
// src/app/shared/constants/api.constants.ts
export const API = {
  // ... existing entries ...
  ENTITY: {
    ROOT: '/v1/<entity>',                                   // GET list / POST create
    BY_ID: (id: string) => `/v1/<entity>/${id}`,           // GET/PUT/DELETE by id
    BY_PARENT: (parentId: string) => `/v1/<entity>/parent/${parentId}`,
    ACTION: (id: string, action: string) => `/v1/<entity>/${id}/${action}`,
  },
} as const;
```

**Prefix rules:**
- Angular constant: `/v1/` (HttpService prepends `/api` from `environment.apiBaseUrl = '/api'`)
- BFF backbone path: `/api/v1/` (forwarded to backbone-rest)
- BFF mount in `server.js`: `/api/v1/<entity>` (Angular HTTP call hits this)

## 4. Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| BFF route file | `<entity>.routes.js` (plural) | `contacts.routes.js` |
| Router const in `server.js` | `<entity>Routes` | `contactsRoutes` |
| Angular constant key | `ENTITY` (uppercase, singular) | `CONTACTS` |
| Static path constant | `ROOT`, `LIST`, `EVENTS` | `ROOT: '/v1/contacts'` |
| Dynamic path function | `BY_ID`, `BY_PERSON`, `LINK_ROLE` | `BY_ID: (id) => \`/v1/contacts/${id}\`` |

## 5. Existing Route → Backbone-rest Path Map

| BFF mount | backbone-rest base path | Angular constant key |
|-----------|------------------------|---------------------|
| `/api/v1/session` | `/api/v1/session` | `API.SESSION` |
| `/api/v1/users` | `/api/v1/users` | `API.USERS` |
| `/api/v1/roles` | `/api/v1/roles` | `API.ROLES` |
| `/api/v1/features` | `/api/v1/features` | `API.FEATURES` |
| `/api/v1/people` | `/api/v1/people` | `API.PEOPLE` |
| `/api/v1/contacts` | `/api/v1/contacts` | `API.CONTACTS` |
| `/api/v1/iam/audit` | `/api/v1/iam/audit` | `API.AUDIT` |

## 6. Constraints

- **Never** put logic in a route handler — one-liner `proxyToBackbone()` only
- **Never** derive the backbone-rest path from `req.body` or `req.query`
- **Never** add a `/api/v1/` prefix to Angular constants (that prefix is added at runtime)
- **Never** duplicate a static path as a function: if it's always the same, use a string literal
- **Always** register the new router in `server.js` before the SSR catch-all

## 7. Quality Checklist

- [ ] BFF route file uses `proxyToBackbone()` exclusively — no logic
- [ ] Router registered in `server.js` at `/api/v1/<entity>`
- [ ] Angular `API.<ENTITY>` constants use `/v1/` prefix
- [ ] Dynamic paths are arrow functions returning template literals
- [ ] `npm run build:ssr` and `npx tsc --noEmit` pass
- [ ] BFF mount → backbone-rest path alignment verified
