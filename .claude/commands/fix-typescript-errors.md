# Fix TypeScript Errors

Diagnose and fix TypeScript strict-mode errors blocking the build or type-check.

**Usage:** `/fix-typescript-errors [scope]`

Example: `/fix-typescript-errors src/app/features/users/`
Example: `/fix-typescript-errors` (fixes all errors)

---

Agent: developer

## Input (from $ARGUMENTS)

`$ARGUMENTS` is the optional scope (file path or directory). If empty, fix all errors.

## Step 1 — Collect All Errors

```bash
npx tsc --noEmit 2>&1
```

Read the full output. Group errors by file.

## Step 2 — Prioritise

Fix in this order:
1. `src/app/shared/models/` and `src/app/shared/constants/` — cascade to many files
2. `src/app/core/services/` — service interfaces affect all consumers
3. `src/app/features/` — component-scoped errors
4. `src/app/core/store/` — NgRx action/selector types

## Step 3 — Common Error Patterns and Fixes

| Error | Typical cause | Fix |
|-------|--------------|-----|
| `Type 'X \| undefined' is not assignable to 'X'` | Strict null check | Add `?? defaultValue` or narrow with `if (x !== undefined)` |
| `Object is possibly 'null'` | Not checking for null | Use optional chaining `x?.property` or null guard |
| `Property 'X' does not exist on type 'Y'` | Model interface missing field | Add field to interface in `src/app/shared/models/` |
| `Argument of type 'string \| null' not assignable` | Signal type mismatch | Use correct signal type: `signal<string \| null>(null)` |
| `No overload matches this call` | Wrong generic type on `HttpService.get<T>` | Correct the response type |
| `Cannot find module '@core/...'` | Wrong path alias | Use `@core/`, `@shared/`, `@app/`, `@env/` aliases |

## Step 4 — Apply Fixes

Fix each error using the minimal change. Do not change unrelated code.

- Missing model fields: add to interface in `src/app/shared/models/<entity>.model.ts`
- Wrong return types: fix the service method generic
- `undefined` issues: add proper null guards or use optional chaining

## Step 5 — Verify Zero Errors

```bash
npx tsc --noEmit   # must return exit code 0
npm run build:ssr  # must pass
```

## Constraints

- Fix only the type error — do not refactor logic
- Never use `as any` as a fix — find the correct type
- Never suppress with `// @ts-ignore` — find the root cause
- Prefer adding to model interfaces over casting

## Output

- Errors found: N
- Errors fixed: N (list file:line → fix applied)
- `npx tsc --noEmit`: ✓ / ✗
- `npm run build:ssr`: ✓ / ✗
