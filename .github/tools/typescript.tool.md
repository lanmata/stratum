---
name: TypeScript
description: Tool for type-checking front-backbone-rest without emitting output (strict mode, no ESLint)
type: terminal
command-prefix: npx tsc
used-by: [Orchestrator, Developer, Test Writer, Code Reviewer, API Designer]
---

# TypeScript

## Purpose
Runs the TypeScript compiler in no-emit mode to detect type errors across the Angular
source tree. This is the only static analysis gate — no ESLint is configured.

## Available Commands

### Type Check (no output files emitted)
```bash
# Check app source (uses tsconfig.app.json implicitly via tsconfig.json)
npx tsc --noEmit

# Check test source
npx tsc --noEmit --project tsconfig.spec.json
```

## TypeScript Config Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | Root config — `strict: true`, path aliases (`@app/*`, `@core/*`, `@shared/*`, `@env/*`) |
| `tsconfig.app.json` | App build config — extends root |
| `tsconfig.spec.json` | Test config — extends root, includes spec files |

## Strict Mode Settings (from `tsconfig.json`)

TypeScript 5.9 strict mode is enabled. All of the following are active:
- `strict: true` (implies `strictNullChecks`, `strictFunctionTypes`, `noImplicitAny`)
- No implicit `any`
- Strict null checks — `null | undefined` must be handled explicitly

## Path Aliases

Configured in `tsconfig.json` and resolved by `@angular/build`:

| Alias | Resolves to |
|-------|------------|
| `@app/*` | `src/app/*` |
| `@core/*` | `src/app/core/*` |
| `@shared/*` | `src/app/shared/*` |
| `@env/*` | `src/environments/*` |

Use these aliases in all imports — never relative paths that cross feature boundaries.

## Notes

- `npx tsc --noEmit` is always faster than `npm run build:ssr` for type checking only.
- Run it **before** committing any TypeScript change.
- The Angular build (`npm run build:ssr`) also type-checks, but is slower.
- BFF files (`server/`) are plain CommonJS JavaScript — not type-checked by this tool.
