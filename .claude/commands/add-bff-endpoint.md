# Add BFF Endpoint

Add a new BFF proxy endpoint and matching Angular API constant for a backbone-rest endpoint.

**Usage:** `/add-bff-endpoint <entityName> <httpMethod> <backbonePath> <angularConstantKey>`

Example: `/add-bff-endpoint document GET /api/v1/documents/:id DOCUMENTS.BY_ID`

---

Agent: api-designer

Read `.claude/skills/api-designer.skill.md`, `.claude/skills/api-contract.skill.md`, and `.claude/skills/bff-proxy.skill.md` before starting.

## Inputs (from $ARGUMENTS)

Parse from $ARGUMENTS:
- `entityName` — singular kebab-case (e.g. `document`)
- `httpMethod` — GET / POST / PUT / DELETE
- `backbonePath` — backbone-rest target path including param placeholders (e.g. `/api/v1/documents/:id`)
- `angularConstantKey` — constant to add or extend (e.g. `DOCUMENTS.BY_ID`)

## Step 1 — Read Existing Files

1. Read `server/routes/users.routes.js` — canonical BFF route reference.
2. Read `src/app/shared/constants/api.constants.ts` — current `API` object.
3. Read `server.js` — check if this entity's router is already mounted.

## Step 2 — Add BFF Route Handler

**If `server/routes/<entityName>.routes.js` does not exist**, create it:

```javascript
'use strict';
const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');
const router = Router();

router.<method>('<routerSubPath>', (req, res) =>
  proxyToBackbone(req, res, '<resolvedBackbonePath>')
);

module.exports = router;
```

**If the file exists**, add the new handler as a one-liner.

BFF handler is always a one-liner — no logic, no validation.

## Step 3 — Register Router in `server.js`

Only if not already mounted. Add **before** `app.get('*splat', ...)`:

```javascript
const <entityName>Routes = require('./server/routes/<entityName>.routes');
app.use('/api/v1/<entityPath>', <entityName>Routes);
```

## Step 4 — Add Angular API Constant

In `src/app/shared/constants/api.constants.ts`:

**If the entity block exists**, add the new key:
```typescript
NEW_KEY: (id: string) => `/v1/<entityPath>/${id}`,
```

**If the block does not exist**, add a new entry:
```typescript
ENTITY_UPPER: {
  ROOT: '/v1/<entityPath>',
  BY_ID: (id: string) => `/v1/<entityPath>/${id}`,
},
```

`as const` must remain at the end of the `API` object.

## Step 5 — Verify

```bash
npx tsc --noEmit
npm run build:ssr
```

## Constraints

- BFF handler is a one-liner — no validation, no transformation
- Path params built from `req.params['key']` only — never `req.body` or `req.query`
- Angular constant prefix is `/v1/` — never `/api/v1/`
- New router must be registered before the SSR catch-all in `server.js`

## Output

Table: BFF mount | backbone-rest path | Angular constant | Status

Files modified/created with CREATED/MODIFIED status. Type check and build pass/fail.
