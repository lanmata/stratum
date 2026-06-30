---
name: Fix TypeScript Errors
description: Diagnoses and fixes TypeScript strict-mode errors blocking the build or type-check in front-backbone-rest
mode: agent
agent: developer
tools: [run_in_terminal, read_file, grep_search, file_search, insert_edit_into_file, replace_string_in_file, get_errors]
---

# Fix TypeScript Errors

Fix all TypeScript strict-mode errors in front-backbone-rest.

**Scope**: ${scope} (e.g. `all files` / `src/app/features/users/` / specific file path)

---

## Step 1 — Collect All Errors

```bash
npx tsc --noEmit 2>&1
```

Read the full output. Group errors by file.

---

## Step 2 — Prioritise

Fix in this order:
1. Errors in `src/app/shared/models/` and `src/app/shared/constants/` — these cascade to many files.
2. Errors in `src/app/core/services/` — service interfaces affect all consumers.
3. Errors in `src/app/features/` — component-scoped errors.
4. Errors in `src/app/core/store/` — NgRx action/selector types.

---

## Step 3 — Common Error Patterns and Fixes

| Error | Typical cause | Fix |
|-------|--------------|-----|
| `Type 'X \| undefined' is not assignable to 'X'` | Strict null check | Add `?? defaultValue` or narrow with `if (x !== undefined)` |
| `Object is possibly 'null'` | Not checking for null | Use optional chaining `x?.property` or null guard |
| `Property 'X' does not exist on type 'Y'` | Model interface missing field | Add field to interface in `src/app/shared/models/` |
| `Argument of type 'string \| null' not assignable` | Signal type mismatch | Use correct signal type: `signal<string \| null>(null)` |
| `No overload matches this call` | Wrong generic type on `HttpService.get<T>` | Correct the response type |
| `Cannot find module '@core/...'` | Wrong path alias | Use `@core/`, `@shared/`, `@app/`, `@env/` aliases |

---

## Step 4 — Apply Fixes

Fix each error using the minimal change. Do not change unrelated code.

For missing model fields: add to the interface in `src/app/shared/models/<entity>.model.ts`.
For wrong return types: fix the service method generic.
For `undefined` issues: add proper null guards or use optional chaining.

---

## Step 5 — Verify Zero Errors

```bash
npx tsc --noEmit
```

Must return exit code `0` with no output.

Also run:
```bash
npm run build:ssr
```

---

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
