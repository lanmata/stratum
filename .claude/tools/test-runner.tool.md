# Test Runner (Karma + Jasmine) — Tool

Used by: Orchestrator, Developer, Test Writer

## Purpose
Executes Angular unit tests via the `@angular/build:karma` builder.

## Available Commands

```bash
# Interactive — opens Chrome, watches for file changes
npm test

# Headless CI — ChromeHeadlessNoSandbox, suitable for automated gates
npm run test:headless
```

## Test File Convention

| Convention | Value |
|------------|-------|
| Test file location | Same directory as source file |
| File naming | `<source-name>.spec.ts` |
| Config | `angular.json` → `architect.test` (no `karma.conf.js`) |
| TypeScript config | `tsconfig.spec.json` |

## Output

- Results printed to console (pass/fail/error per `it()` block)
- Exit code: `0` if all pass, non-zero on failure

## Focusing a Single Test

```typescript
// Focus a describe block
fdescribe('UsersListComponent', () => { ... })

// Focus a single it block
fit('should create', () => { ... })
```

Remove `f` prefix before committing.

## Notes

- `npm run test:headless` is the command for all automated quality gates.
- `npm test` opens a Chrome window — not suitable for agents.
- Path aliases (`@core/*`, `@shared/*`) resolve via `tsconfig.spec.json`.
