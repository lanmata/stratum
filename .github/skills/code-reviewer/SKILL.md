---
name: Code Reviewer Skills
description: Convention checklist and diff-review procedure for Angular 20 + Express 5 BFF changes in front-backbone-rest
applies-to: [Code Reviewer]
---

# Code Reviewer — Skill Definition

## 1. Review Procedure

1. Read the full diff of every changed file.
2. Run `grep_search` for forbidden patterns listed in §3.
3. Apply the checklist in §4.
4. Categorise findings and produce the report (§7).

## 2. Key File Paths to Always Check

| Path | What to verify |
|------|---------------|
| `src/app/app.routes.ts` | Lazy loading, `canActivate: [authGuard]` on protected routes |
| `src/app/shared/constants/api.constants.ts` | `/v1/` prefix, `as const`, no hardcoded strings elsewhere |
| `server/routes/*.routes.js` | One-liner handlers, no logic |
| `server.js` | Rate limiter not bypassed; new routes registered before SSR catch-all |
| `src/app/core/store/session/` | No new NgRx slices added outside session |

## 3. Forbidden Pattern Grep Commands

```bash
# *ngIf / *ngFor (banned — use @if / @for)
grep -rn "\*ngIf\|\*ngFor" src/app/ --include="*.ts"

# Direct HttpClient injection (banned — use HttpService)
grep -rn "inject(HttpClient)\|private.*: HttpClient" src/app/ --include="*.ts"

# Direct localStorage access (banned — use StorageMockService)
grep -rn "localStorage\." src/app/ --include="*.ts"

# Hardcoded URL strings
grep -rn "'/api\|\"\/api\|http://\|https://" src/app/ --include="*.ts"

# console.log in Angular production code
grep -rn "console\.log\|console\.debug" src/app/ --include="*.ts" --exclude="*.spec.ts"

# Logic in BFF route handlers (anything beyond proxyToBackbone call)
grep -rn "if \|switch \|for \|while \|\.filter\|\.map\|\.find" server/routes/ --include="*.js"

# Constructor injection (banned — use inject())
grep -rn "constructor(" src/app/ --include="*.ts" | grep -v "spec\|test"
```

Expected: zero results for all of the above.

## 4. Convention Checklist

### Angular
- [ ] `standalone: true` on every component
- [ ] `inject()` used for DI — no constructor parameters
- [ ] `@if` / `@for` / `@let` / `@empty` — no `*ngIf` / `*ngFor`
- [ ] No direct `HttpClient` injection
- [ ] Local state: `signal<T>(initial)` — not class fields or `BehaviorSubject`
- [ ] Inline template — no separate `.html` file
- [ ] All new routes lazy-loaded with `loadComponent` or `loadChildren`
- [ ] `canActivate: [authGuard]` on all protected routes in `app.routes.ts`
- [ ] `API.*` constants used — no hardcoded URL strings

### BFF
- [ ] Each handler in `server/routes/*.js` is a one-liner calling `proxyToBackbone()`
- [ ] New router registered in `server.js` before the SSR catch-all handler
- [ ] `req.params['key']` bracket notation (not dot notation)
- [ ] New env-vars have a safe default in `server/config/constants.js`

### TypeScript
- [ ] No `any` without explicit type assertion justification
- [ ] All imported model interfaces use the correct suffix (`TO`, `Request`, `Response`)
- [ ] No `!` non-null assertions without explanation

### Formatting
- [ ] Line length ≤ 100 characters (`printWidth: 100`)
- [ ] Single quotes for strings (except HTML attribute values)
- [ ] No trailing commas in TypeScript (check tsconfig)

## 5. Naming Conventions Check

| Artifact | Expected pattern |
|----------|-----------------|
| Component class | `<Entity><Role>Component` |
| Service class | `<Entity>Service` |
| Model interface | `<Entity>TO` or `<Entity>Request` |
| Component selector | `app-<entity>-<role>` |
| BFF route file | `<entity>.routes.js` (plural noun) |

## 6. Bundle Impact

Check `angular.json` budgets: `maximumWarning: 500kB`, `maximumError: 1MB` for initial load.
If a new lazy-loaded feature is added, no budget concern. If a new import is added to
`app.config.ts` (eagerly loaded), flag it for size impact review.

## 7. Report Format

```
## Review Report — <file or PR description>

### Crítico (must fix before merge)
- `src/path/file.ts:42` — <issue and how to fix>

### Importante (should fix before merge)
- `server/routes/x.routes.js:8` — <issue>

### Sugerencia (optional improvement)
- `src/app/features/...` — <observation>

### Passed
- Standalone: ✓  inject(): ✓  @if/@for: ✓
- No *ngIf/*ngFor: ✓  No direct HttpClient: ✓
- BFF one-liners: ✓  Auth guard: ✓
```

## 8. Quality Checklist

- [ ] Grep commands for forbidden patterns all returned zero results
- [ ] Convention checklist fully applied
- [ ] Report categorised as Crítico / Importante / Sugerencia
- [ ] No edits made (this agent is read-only)
