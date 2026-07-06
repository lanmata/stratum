# TypeScript — Tool

Used by: Orchestrator, Developer, Test Writer, Code Reviewer, API Designer

## Purpose
Runs the TypeScript compiler in no-emit mode to detect type errors across the Angular
source tree. This is the only static analysis gate — no ESLint is configured.

## Available Commands

```bash
# Check app source
npx tsc --noEmit

# Check test source
npx tsc --noEmit --project tsconfig.spec.json
```

## TypeScript Config Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | Root config — `strict: true`, path aliases |
| `tsconfig.app.json` | App build config — extends root, includes `src/**/*.ts` |
| `tsconfig.spec.json` | Test config — extends root, includes spec files |

## Strict Mode (all active)

- `strict: true` — implies `strictNullChecks`, `strictFunctionTypes`, `noImplicitAny`
- `noUnusedLocals: true`
- `noImplicitOverride: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`

## Path Aliases

| Alias | Resolves to |
|-------|------------|
| `@app/*` | `src/app/*` |
| `@core/*` | `src/app/core/*` |
| `@shared/*` | `src/app/shared/*` |
| `@env/*` | `src/environments/*` |

Use these aliases in all imports — never relative paths that cross feature boundaries.

## Notes

- `npx tsc --noEmit` is faster than `npm run build:ssr` for type checking only.
- Run it before committing any TypeScript change.
- BFF files (`server/`) are plain CommonJS JavaScript — not type-checked by this tool.
- Never use `as any` or `// @ts-ignore` as a fix — find the correct type.
