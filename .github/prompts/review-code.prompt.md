---
name: Review Code
description: Read-only convention and quality review of changed files in front-backbone-rest — Angular 20, Express BFF, TypeScript strict
mode: agent
agent: code-reviewer
tools: [read_file, grep_search, file_search, get_errors]
---

# Review Code

Review the following changed files in front-backbone-rest for convention compliance,
TypeScript correctness, and BFF proxy rules.

**Changed files**: ${changedFiles}
(List of paths, e.g. `src/app/features/users/users-list/users-list.component.ts, server/routes/users.routes.js`)

---

## Step 1 — Read All Changed Files

Read every file in `${changedFiles}` in full.

---

## Step 2 — Run Forbidden Pattern Greps

```bash
# Banned control flow
grep -rn "\*ngIf\|\*ngFor" src/app/ --include="*.ts"

# Direct HttpClient injection
grep -rn "inject(HttpClient)" src/app/ --include="*.ts"

# Direct localStorage
grep -rn "localStorage\." src/app/ --include="*.ts"

# Hardcoded URLs
grep -rn "'/api\|\"\/api\|http://" src/app/ --include="*.ts"

# console.log in Angular code
grep -rn "console\.log" src/app/ --include="*.ts" --exclude="*.spec.ts"

# Logic in BFF routes
grep -rn "if \|switch \|\.filter\|\.map" server/routes/ --include="*.js"

# Constructor injection
grep -rn "constructor(" src/app/ --include="*.ts" | grep -v "spec\|//\|test"
```

---

## Step 3 — Apply Checklist

See `.github/skills/code-reviewer/SKILL.md` §4 for the full convention checklist.
See `.github/skills/component-patterns.skill.md` for Angular component rules.
See `.github/skills/bff-proxy.skill.md` for BFF route rules.

Key checks:
- [ ] `standalone: true` on every component
- [ ] `inject()` — no constructor injection
- [ ] `@if` / `@for` only — no `*ngIf` / `*ngFor`
- [ ] `API.*` constants — no hardcoded URL strings
- [ ] BFF handlers: one-liner `proxyToBackbone()` — no logic
- [ ] All new routes: `canActivate: [authGuard]`
- [ ] Lazy loading: `loadComponent` or `loadChildren` — no eager imports
- [ ] No `console.log` in Angular production code
- [ ] No direct `localStorage` access

---

## Step 4 — Produce Report

Use the report format from `.github/skills/code-reviewer/SKILL.md` §7:

```
## Review Report — <description of change>

### Crítico
- `file:line` — issue

### Importante
- `file:line` — issue

### Sugerencia
- `file:line` — observation

### Passed
- list of checked items that passed ✓
```

---

## Constraints

- Read-only — do not edit any file
- Report only findings that violate documented conventions
- Reference the specific file and line number for every finding
