---
name: Fix Bug
description: Diagnoses and fixes a bug in front-backbone-rest following project conventions
mode: agent
agent: developer
tools: [run_in_terminal, read_file, grep_search, file_search, insert_edit_into_file, replace_string_in_file, get_errors]
---

# Fix Bug

Diagnose and fix the following bug in front-backbone-rest.

**Bug description**: ${bugDescription}
**Affected area**: ${affectedArea} (e.g. `UsersListComponent` / `user.service.ts` / `users.routes.js`)
**Steps to reproduce**: ${stepsToReproduce}
**Expected behaviour**: ${expectedBehaviour}
**Actual behaviour**: ${actualBehaviour}

---

## Step 1 — Locate the Bug

1. Read the file(s) in `${affectedArea}`.
2. Use `grep_search` to find related code if the location is unclear.
3. Run `get_errors` to collect TypeScript / build diagnostics.
4. If the bug is in a BFF route, also read `server/shared/proxy.js`.

---

## Step 2 — Diagnose Root Cause

Identify whether the bug is in:

| Layer | Suspect patterns |
|-------|----------------|
| Component | Wrong signal initial value; `fixture.detectChanges()` not called; `@if` condition inverted |
| Service | Wrong `API.*` constant; HTTP method mismatch; incorrect response type |
| BFF route | Wrong backbone-rest path; method not registered; route registered after SSR catch-all |
| Interceptor | Token not attached; 401/403 redirect missing |
| Route guard | `isAuthenticated$` observable not completing |
| Angular router | Missing `canActivate`; eager import instead of lazy |

---

## Step 3 — Apply the Fix

Apply the minimum change needed. Do not refactor surrounding code.

Constraints:
- Never use `*ngIf` / `*ngFor` — use `@if` / `@for`
- Never inject `HttpClient` — use `HttpService`
- Never use `localStorage` directly — use `StorageMockService`
- BFF handlers must remain one-liners

---

## Step 4 — Verify Fix

```bash
npx tsc --noEmit         # no new type errors
npm run build:ssr        # build still passes
npm run test:headless    # no regressions
```

If a test was already covering the broken behaviour, it should now pass.
If no test exists for this behaviour, note it in the output so test-writer can act.

---

## Output

- Root cause: one sentence
- Fix applied: file path(s) + brief description of change
- Quality gate: build ✓/✗, tests ✓/✗, type-check ✓/✗
- Test gap: yes/no (add test recommended)
