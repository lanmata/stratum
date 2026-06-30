---
name: Full Feature Delivery
description: End-to-end multi-agent orchestration for a new entity in front-backbone-rest — delegates to api-designer, developer, test-writer, code-reviewer, and optionally security-reviewer
mode: agent
agent: orchestrator
tools: [run_in_terminal, read_file, grep_search, file_search, insert_edit_into_file, replace_string_in_file, create_file, get_errors, run_subagent]
---

# Full Feature Delivery

Deliver the entity **`${featureName}`** end-to-end in front-backbone-rest.

**backbone-rest base path**: `${backboneBasePath}` (e.g. `/api/v1/documents`)
**HTTP methods**: `${httpMethods}` (e.g. `GET list, GET by id, POST, PUT, DELETE`)
**Security scan required**: `${securityScan}` (`yes` if auth-related or deps change / `no`)

---

## Delivery Plan (state this to the user before acting)

| Step | Agent | Prompt | Description |
|------|-------|--------|-------------|
| 1 | api-designer | `add-api-endpoint.prompt.md` | BFF routes + Angular API constants |
| 2 | developer | `implement-feature.prompt.md` | Model, service, component, app route |
| 3 | test-writer | `write-unit-tests.prompt.md` | Jasmine tests for service + component |
| 4 | code-reviewer | `review-code.prompt.md` | Convention check on all new files |
| 5 (if yes) | security-reviewer | `security-audit.prompt.md` | Auth and injection check |
| 6 | orchestrator | quality gate | `build + test:headless + tsc --noEmit` |

---

## Step 1 — API Designer

Delegate to **api-designer** with `.github/prompts/add-api-endpoint.prompt.md`:

- entityName: `${featureName}`
- backboneBasePath: `${backboneBasePath}`
- httpMethods: `${httpMethods}`

Wait for completion. Confirm:
- BFF route file created at `server/routes/${featureName}.routes.js`
- Router registered in `server.js`
- `API.${FEATURE_UPPER}` block added to `api.constants.ts`

---

## Step 2 — Developer

Delegate to **developer** with `.github/prompts/implement-feature.prompt.md`:

- entityName: `${featureName}`
- backboneBasePath: `${backboneBasePath}`
- httpMethods: `${httpMethods}`

Wait for completion. Confirm:
- Model in `src/app/shared/models/${featureName}.model.ts`
- Service in `src/app/core/services/${featureName}.service.ts`
- List component in `src/app/features/${featureName}/${featureName}-list/`
- Route in `src/app/app.routes.ts` with `canActivate: [authGuard]`

---

## Step 3 — Test Writer

Delegate to **test-writer** with `.github/prompts/write-unit-tests.prompt.md`:

Targets:
- `src/app/core/services/${featureName}.service.ts`
- `src/app/features/${featureName}/${featureName}-list/${featureName}-list.component.ts`

Wait for `npm run test:headless` confirmation.

---

## Step 4 — Code Reviewer

Delegate to **code-reviewer** with `.github/prompts/review-code.prompt.md`:

changedFiles: all files created or modified in steps 1–3.

If **Crítico** findings are returned, delegate fixes to **developer**, then re-run code-reviewer.

---

## Step 5 (conditional) — Security Reviewer

If `${securityScan}` is `yes`, delegate to **security-reviewer** with
`.github/prompts/security-audit.prompt.md`:

scope: `bff-routes`
trigger: `new-feature`

---

## Step 6 — Quality Gate

```bash
npm run build:ssr          # must pass
npm run test:headless      # must pass
npx tsc --noEmit           # must pass
```

All three must pass before issuing the delivery report.

---

## Delivery Report Format

```
## Feature Delivery — ${featureName}

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
| server/routes/${featureName}.routes.js | CREATED |
| src/app/shared/models/${featureName}.model.ts | CREATED |
| src/app/core/services/${featureName}.service.ts | CREATED |
| src/app/features/${featureName}/... | CREATED |
| src/app/app.routes.ts | MODIFIED |
| server.js | MODIFIED |

### Quality Gate
- Build: ✓
- Tests: ✓
- Type-check: ✓

### Manual Steps (if any)
- <env-var to add to deployment>
```
