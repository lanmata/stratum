---
name: Add API Endpoint
description: Creates an Express 5 BFF proxy route and matching Angular API constant for a new backbone-rest endpoint in front-backbone-rest
mode: agent
agent: api-designer
tools: [run_in_terminal, read_file, grep_search, file_search, insert_edit_into_file, replace_string_in_file, create_file, get_errors]
---

# Add API Endpoint

Add a new BFF proxy endpoint to front-backbone-rest.

- **Entity**: `${entityName}` (e.g. `document`)
- **BFF route file**: `server/routes/${entityName}.routes.js` (create if it does not exist)
- **HTTP method**: `${httpMethod}` (GET / POST / PUT / DELETE)
- **BFF mount path**: `/api/v1/${entityPath}` (e.g. `/api/v1/documents`)
- **backbone-rest target path**: `${backbonePath}` (e.g. `/api/v1/documents/:id`)
- **Angular constant key**: `API.${ENTITY_UPPER}.${CONSTANT_KEY}` (e.g. `API.DOCUMENTS.BY_ID`)

---

## Step 1 — Read Existing Files

1. Read `server/routes/users.routes.js` — canonical BFF route reference.
2. Read `src/app/shared/constants/api.constants.ts` — current `API` object.
3. Read `server.js` — check if this entity's router is already mounted.

---

## Step 2 — Add BFF Route

**If `server/routes/${entityName}.routes.js` does not exist**, create it:

```javascript
'use strict';
const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');
const router = Router();

router.${httpMethod.toLowerCase()}('${routerSubPath}', (req, res) =>
  proxyToBackbone(req, res, '${backbonePath.replace(':id', `\${req.params['id']}`)}')
);

module.exports = router;
```

**If the file exists**, add the new handler inline — one-liner only, no logic.

---

## Step 3 — Register Router in `server.js`

Only if not already mounted. Add **before** `app.get('*splat', ...)`:

```javascript
const ${entityName}Routes = require('./server/routes/${entityName}.routes');
app.use('/api/v1/${entityPath}', ${entityName}Routes);
```

---

## Step 4 — Add Angular API Constant

In `src/app/shared/constants/api.constants.ts`, inside the `API` object:

**If the `${ENTITY_UPPER}` block exists**, add the new key:
```typescript
${CONSTANT_KEY}: ${isStatic ? `'/v1/${entityPath}/${subPath}'` : `(id: string) => \`/v1/${entityPath}/\${id}\``},
```

**If the block does not exist**, add a new entry:
```typescript
${ENTITY_UPPER}: {
  ${CONSTANT_KEY}: ${isStatic ? `'/v1/${entityPath}'` : `(id: string) => \`/v1/${entityPath}/\${id}\``},
},
```

`as const` must remain at the end of the `API` object.

---

## Step 5 — Verify

```bash
npx tsc --noEmit    # TypeScript types correct
npm run build:ssr   # Build passes
```

---

## Constraints

- BFF handler is a one-liner calling `proxyToBackbone()` — no validation, no transformation
- Path params built from `req.params['key']` only — never `req.body` or `req.query`
- Angular constant prefix is `/v1/` — never `/api/v1/`
- New router must be registered before the SSR catch-all in `server.js`

## Output

Table: BFF mount | backbone-rest path | Angular constant | Status

Files modified/created with path and CREATED/MODIFIED status.
