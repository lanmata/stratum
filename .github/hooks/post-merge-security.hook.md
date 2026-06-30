---
name: Post-Merge Security Scan
description: Non-blocking dependency and auth security scan that runs after merges to main when package.json or auth-critical files change
trigger: push_to_main
agents: [security-reviewer]
auto-block: false
---

# Post-Merge Security Scan

## Trigger Conditions

- **Event**: Push / merge to `main`
- **Condition**: At least one of the following files was modified:
  - `package.json`
  - `package-lock.json`
  - `server/shared/proxy.js`
  - `server/config/constants.js`
  - `src/app/core/interceptors/auth.interceptor.ts`
  - `src/app/core/interceptors/error.interceptor.ts`
  - `src/app/core/guards/auth.guard.ts`
  - `src/app/core/store/session/session.effects.ts`

## Steps

### Step 1 — Determine Scope

| Changed file | Scan scope |
|-------------|-----------|
| `package.json` / `package-lock.json` | `dependencies` |
| `server/` files | `bff-routes` |
| `src/app/core/interceptors/` or `guards/` or `store/session/` | `auth-flow` |
| Multiple triggers | `full` |

### Step 2 — Security Scan (subagent)

Invoke **security-reviewer** with `.github/prompts/security-audit.prompt.md`.

scope: determined in Step 1
trigger: `post-merge`

## Fail Behaviour

Non-blocking — this hook does not revert the merge.

If **Critical** findings are found:
- Open a GitHub issue titled `[SECURITY] Post-merge finding — <brief description>`
- Tag it `security` and `priority: high`
- Assign to the team lead

If no critical findings, post a brief summary comment on the merge commit.

## Output

```markdown
## Post-Merge Security Scan — front-backbone-rest

Triggered by: changes to ${changedFiles}
Scope: ${scope}

| Check | Result |
|-------|--------|
| Hardcoded secrets | ✓ none found |
| Auth flow invariants | ✓ no violations |
| BFF path construction | ✓ no injection vectors |
| npm audit (high/critical) | ✓ 0 findings / ✗ N findings |

<!-- If critical findings: issue #N opened -->
```
