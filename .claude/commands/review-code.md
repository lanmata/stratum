# Review Code

Read-only convention and quality review of changed files in front-backbone-rest.

**Usage:** `/review-code <changedFiles>`

Example: `/review-code src/app/features/users/users-list/users-list.component.ts,server/routes/users.routes.js`
Example: `/review-code` (reviews all files changed since last commit via `git diff`)

---

Agent: code-reviewer

Read `.claude/skills/code-reviewer.skill.md` before starting. This agent is read-only — do not edit any file.

## Inputs (from $ARGUMENTS)

`$ARGUMENTS` is a comma-separated list of file paths to review. If empty, derive from `git diff --name-only`.

## Step 1 — Read All Changed Files

Read every file in the list in full.

## Step 2 — Run Forbidden Pattern Greps

```bash
grep -rn "\*ngIf\|\*ngFor" src/app/ --include="*.ts"
grep -rn "inject(HttpClient)" src/app/ --include="*.ts"
grep -rn "localStorage\." src/app/ --include="*.ts"
grep -rn "'/api\|\"\/api\|http://" src/app/ --include="*.ts"
grep -rn "console\.log" src/app/ --include="*.ts" --exclude="*.spec.ts"
grep -rn "if \|switch \|\.filter\|\.map" server/routes/ --include="*.js"
grep -rn "constructor(" src/app/ --include="*.ts" | grep -v "spec\|//\|test"
```

All of the above must return zero results.

## Step 3 — Apply Convention Checklist

From `.claude/skills/code-reviewer.skill.md` §4:

### Angular
- [ ] `standalone: true` on every component
- [ ] `inject()` — no constructor injection
- [ ] `@if` / `@for` / `@let` — no `*ngIf` / `*ngFor`
- [ ] No direct `HttpClient` injection
- [ ] Local state: `signal<T>()` — not `BehaviorSubject`
- [ ] Inline template — no separate `.html` file
- [ ] All new routes lazy-loaded
- [ ] `canActivate: [authGuard]` on protected routes
- [ ] `API.*` constants — no hardcoded URL strings

### BFF
- [ ] Route handlers are one-liners calling `proxyToBackbone()`
- [ ] New router registered in `server.js` before SSR catch-all
- [ ] `req.params['key']` bracket notation

### TypeScript
- [ ] No `any` without justification
- [ ] Model interfaces use correct suffix (`TO`, `Request`, `Response`)

## Step 4 — Produce Report

```
## Review Report — <description>

### Crítico (must fix before merge)
- `src/path/file.ts:42` — <issue and how to fix>

### Importante (should fix before merge)
- `server/routes/x.routes.js:8` — <issue>

### Sugerencia (optional)
- <file:line> — <observation>

### Passed
- Standalone: ✓  inject(): ✓  @if/@for: ✓
- BFF one-liners: ✓  Auth guard: ✓
```

## Constraints

- Read-only — do not edit any file
- Reference specific file and line number for every finding
