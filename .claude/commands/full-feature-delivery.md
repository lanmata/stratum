# Full Feature Delivery

End-to-end multi-agent orchestration for a new entity in front-backbone-rest.

**Usage:** `/full-feature-delivery <featureName> <backboneBasePath> <httpMethods> [securityScan=yes|no]`

Example: `/full-feature-delivery document /api/v1/documents "GET list, GET by id, POST, PUT, DELETE" securityScan=no`

---

Agent: orchestrator

## Inputs (from $ARGUMENTS)

Parse from $ARGUMENTS:
- `featureName` — singular kebab-case entity name (e.g. `document`)
- `backboneBasePath` — backbone-rest base path (e.g. `/api/v1/documents`)
- `httpMethods` — comma/space-separated list
- `securityScan` — `yes` or `no` (default: `no`)

## Delivery Plan (state this to the user before acting)

| Step | Agent | Command | Description |
|------|-------|---------|-------------|
| 1 | api-designer | `/add-bff-endpoint` | BFF routes + Angular API constants |
| 2 | developer | `/implement-feature` | Model, service, component, app route |
| 3 | test-writer | `/write-unit-tests` | Jasmine tests for service + component |
| 4 | code-reviewer | `/review-code` | Convention check on all new files |
| 5 (if yes) | security-reviewer | `/security-audit` | Auth and injection check |
| 6 | orchestrator | quality gate | `build + test:headless + tsc --noEmit` |

## Step 1 — API Designer

Invoke api-designer with `/add-bff-endpoint`:
- entityName: `<featureName>`
- backboneBasePath: `<backboneBasePath>`
- httpMethods: `<httpMethods>`

Wait for completion. Confirm:
- BFF route file at `server/routes/<featureName>.routes.js`
- Router registered in `server.js`
- `API.<FEATURE_UPPER>` block added to `api.constants.ts`

## Step 2 — Developer

Invoke developer with `/implement-feature`:
- entityName: `<featureName>`
- backboneBasePath: `<backboneBasePath>`
- httpMethods: `<httpMethods>`

Wait for completion. Confirm:
- Model at `src/app/shared/models/<featureName>.model.ts`
- Service at `src/app/core/services/<featureName>.service.ts`
- List component at `src/app/features/<featureName>/<featureName>-list/`
- Route in `src/app/app.routes.ts` with `canActivate: [authGuard]`

## Step 3 — Test Writer

Invoke test-writer with `/write-unit-tests` for:
- `src/app/core/services/<featureName>.service.ts`
- `src/app/features/<featureName>/<featureName>-list/<featureName>-list.component.ts`

Wait for `npm run test:headless` confirmation.

## Step 4 — Code Reviewer

Invoke code-reviewer with `/review-code` on all files created or modified in steps 1–3.

If **Crítico** findings are returned, fix with developer, then re-run code-reviewer.

## Step 5 (conditional) — Security Reviewer

If `securityScan` is `yes`, invoke security-reviewer with `/security-audit bff-routes`.

## Step 6 — Quality Gate

```bash
npm run build:ssr          # must pass
npm run test:headless      # must pass
npx tsc --noEmit           # must pass
```

All three must pass before issuing the delivery report.

## Delivery Report Format

```
## Feature Delivery — <featureName>

### Subtasks
| Step | Agent | Status |
|------|-------|--------|
| API contract | api-designer | ✓ |
| Implementation | developer | ✓ |
| Tests | test-writer | ✓ |
| Code review | code-reviewer | ✓ (N findings fixed) |
| Security | security-reviewer | ✓ / skipped |

### Files
| File | Status |
|------|--------|
| server/routes/<featureName>.routes.js | CREATED |
| src/app/shared/models/<featureName>.model.ts | CREATED |
| src/app/core/services/<featureName>.service.ts | CREATED |
| src/app/features/<featureName>/... | CREATED |
| src/app/app.routes.ts | MODIFIED |
| server.js | MODIFIED |

### Quality Gate
- Build: ✓
- Tests: ✓
- Type-check: ✓
```
