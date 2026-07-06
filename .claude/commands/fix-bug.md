# Fix Bug

Diagnose and fix a bug in front-backbone-rest.

**Usage:** `/fix-bug <description>`

Example: `/fix-bug UsersListComponent shows empty list even when users exist in the API response`

---

Agent: developer

## Input (from $ARGUMENTS)

$ARGUMENTS contains a description of the bug. Extract:
- What is broken (component, service, BFF route, interceptor, etc.)
- Expected vs actual behaviour

## Step 1 — Locate the Bug

1. Read the file(s) in the affected area.
2. Grep for related code if the location is unclear.
3. Check for TypeScript errors: `npx tsc --noEmit`
4. If the bug is in a BFF route, also read `server/shared/proxy.js`.

## Step 2 — Diagnose Root Cause

| Layer | Suspect patterns |
|-------|----------------|
| Component | Wrong signal initial value; `@if` condition inverted; `fixture.detectChanges()` not called in tests |
| Service | Wrong `API.*` constant; HTTP method mismatch; incorrect response type |
| BFF route | Wrong backbone-rest path; method not registered; route registered after SSR catch-all |
| Interceptor | Token not attached; 401/403 redirect missing |
| Route guard | `isAuthenticated$` observable not completing |
| Angular router | Missing `canActivate`; eager import instead of lazy |

## Step 3 — Apply the Fix

Apply the minimum change needed. Do not refactor surrounding code.

Constraints:
- Never use `*ngIf` / `*ngFor` — use `@if` / `@for`
- Never inject `HttpClient` — use `HttpService`
- Never use `localStorage` directly — use `StorageMockService`
- BFF handlers must remain one-liners

## Step 4 — Verify Fix

```bash
npx tsc --noEmit
npm run build:ssr
npm run test:headless
```

## Output

- Root cause: one sentence
- Fix applied: file path(s) + brief description of change
- Quality gate: build ✓/✗, tests ✓/✗, type-check ✓/✗
- Test gap: note if no test covers this behaviour (recommend `/write-unit-tests`)
