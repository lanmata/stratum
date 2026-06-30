---
name: Review API Contract
description: Verifies alignment between Express BFF route paths and Angular API constants for a given entity in front-backbone-rest
mode: agent
agent: api-designer
tools: [read_file, grep_search, file_search, get_errors]
---

# Review API Contract

Verify the BFF-to-Angular API contract alignment for **`${entityName}`** in front-backbone-rest.

**BFF route file**: `server/routes/${entityName}.routes.js`
**Angular constant block**: `API.${ENTITY_UPPER}` in `src/app/shared/constants/api.constants.ts`
**Angular service**: `src/app/core/services/${entityName}.service.ts`

---

## Step 1 — Read All Three Files

Read in full:
1. `server/routes/${entityName}.routes.js`
2. `src/app/shared/constants/api.constants.ts`
3. `src/app/core/services/${entityName}.service.ts`

---

## Step 2 — Build Alignment Table

For each route in the BFF file, verify:

| BFF method + path | `proxyToBackbone` target | Angular constant | Service method | Aligned? |
|-------------------|------------------------|-----------------|---------------|----------|
| `GET /` | `/api/v1/...` | `API.X.ROOT` | `getAll()` | ✓/✗ |
| `GET /:id` | `/api/v1/.../:id` | `API.X.BY_ID(id)` | `getById(id)` | ✓/✗ |
| `POST /` | `/api/v1/...` | `API.X.ROOT` | `create(req)` | ✓/✗ |

---

## Step 3 — Verify Prefix Rule

- BFF `proxyToBackbone` third argument: must start with `/api/v1/`
- Angular `API.*` constant values: must start with `/v1/` (not `/api/v1/`)
- `HttpService` base: `environment.apiBaseUrl = '/api'` — prepended at runtime

Flag any mismatch.

---

## Step 4 — Verify Registration

Check `server.js` for:
```javascript
app.use('/api/v1/${entityPath}', ${entityName}Routes);
```

Confirm it appears **before** the SSR catch-all `app.get('*splat', ...)`.

---

## Step 5 — Verify TypeScript Types

For each service method, check that:
- The generic type matches the model interface (e.g. `Observable<UserTO[]>`)
- The `API.*` constant path matches what the service actually passes to `HttpService`

```bash
npx tsc --noEmit
```

---

## Output

Alignment table (Step 2).
Prefix check: ✓ / ✗ with details.
Registration check: ✓ / ✗.
TypeScript: ✓ / ✗.
Issues list (if any) with file:line references.
