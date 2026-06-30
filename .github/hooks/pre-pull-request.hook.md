---
name: Pre-Pull-Request Gate
description: Blocking quality gate that runs before any PR is merged to main — type-check, headless tests, code review, and conditional security scan
trigger: pull_request_opened
agents: [code-reviewer, security-reviewer]
auto-block: true
---

# Pre-Pull-Request Gate

## Trigger Conditions

- **Event**: Pull request opened or updated targeting `main`
- **Condition**: Any file under `src/`, `server/`, `angular.json`, `tsconfig*.json`, or `package.json` changed

## Steps (in order — blocking)

### Step 1 — TypeScript Type Check
```bash
npx tsc --noEmit
```
**Fail behaviour**: Block PR. Post comment with type errors.

### Step 2 — Headless Unit Tests
```bash
npm run test:headless
```
**Fail behaviour**: Block PR. Post comment with failed test names.

### Step 3 — Production Build
```bash
npm run build:ssr
```
**Fail behaviour**: Block PR. Post comment with build error and any budget violations.

### Step 4 — Code Review (subagent)

Invoke **code-reviewer** with `.github/prompts/review-code.prompt.md`.

changedFiles: all files modified in this PR.

**Fail behaviour**: If any **Crítico** finding is found, block PR and post the review report as a comment. **Importante** and **Sugerencia** items are posted but do not block.

### Step 5 — Security Scan (conditional subagent)

Run **only if** at least one of these is true:
- `package.json` or `package-lock.json` was modified
- Any file under `src/app/core/interceptors/`, `src/app/core/guards/`, or `src/app/core/store/session/` was modified
- Any file under `server/` was modified

Invoke **security-reviewer** with `.github/prompts/security-audit.prompt.md`.

scope: `bff-routes` (if only server/ changed) / `auth-flow` (if interceptors/guards changed) / `dependencies` (if package.json changed) / `full` (if multiple triggers)

**Fail behaviour**: If any **Critical** security finding, block PR.

## Output

Post a single PR comment with:

```markdown
## Pre-PR Gate — front-backbone-rest

| Check | Status | Details |
|-------|--------|---------|
| TypeScript (`tsc --noEmit`) | ✓/✗ | N errors |
| Unit tests (`test:headless`) | ✓/✗ | N failures |
| Build (`build:ssr`) | ✓/✗ | budget OK/violated |
| Code review | ✓/✗ | N Crítico, N Importante |
| Security scan | ✓/✗/skipped | N Critical findings |

<details><summary>Code Review Report</summary>
<!-- reviewer output here -->
</details>
```
