---
name: Test Runner (Karma + Jasmine)
description: Tool for running Angular 20 unit tests via Karma 6 and Jasmine 5 in front-backbone-rest
type: terminal
command-prefix: npm
used-by: [Orchestrator, Developer, Test Writer]
---

# Test Runner — Karma + Jasmine

## Purpose
Executes Angular unit tests via the `@angular/build:karma` builder. Two modes:
interactive (opens Chrome) for development, and headless (CI-safe) for pipelines.

## Available Commands

### Interactive (development)
```bash
# Opens Chrome, watches for file changes, re-runs on save
npm test
```

### Headless / CI
```bash
# ChromeHeadlessNoSandbox — no Chrome window, suitable for CI
npm run test:headless
```

## Test File Convention

| Convention | Value |
|------------|-------|
| Test file location | Same directory as source file |
| File naming | `<source-name>.spec.ts` |
| Test runner config | `angular.json` → `architect.test` (no `karma.conf.js`) |
| TypeScript config | `tsconfig.spec.json` |

## Output

- Results printed to console (pass/fail/error per `it()` block)
- Coverage output: `coverage/` (if karma-coverage is configured to produce files)
- Exit code: `0` if all tests pass, non-zero on failure

## Running a Single Test File

```bash
# Karma does not support running a single file natively.
# Use fdescribe / fit to focus a specific suite or test:
fdescribe('UsersListComponent', () => { ... })  // focuses this describe block
fit('should create', () => { ... })             // focuses this it block
```

Remove `f` prefix before committing.

## Notes

- `npm run test:headless` is the command to use in hooks and quality gates.
- `npm test` opens a Chrome window — not suitable for automated agents.
- All test dependencies are under `devDependencies` (`jasmine-core`, `karma`, `karma-chrome-launcher`, `karma-jasmine`, `karma-coverage`, `karma-jasmine-html-reporter`).
- Tests import path aliases (`@core/*`, `@shared/*`) — these are resolved by the Karma build via `tsconfig.spec.json`.
