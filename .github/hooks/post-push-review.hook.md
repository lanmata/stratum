---
name: Post-Push Code Review
description: Non-blocking convention review that runs after every push to a feature branch — posts findings as a commit comment
trigger: push
agents: [code-reviewer]
auto-block: false
---

# Post-Push Code Review

## Trigger Conditions

- **Event**: Push to any branch **except** `main`
- **Condition**: At least one file under `src/` or `server/` was modified

## Steps

### Step 1 — Code Review (subagent)

Invoke **code-reviewer** with `.github/prompts/review-code.prompt.md`.

changedFiles: all files modified in this push (compare with previous commit).

### Step 2 — Post Results

Post a commit comment (not a blocking check) with the review report.

## Fail Behaviour

Non-blocking — this hook never prevents a push.

If **Crítico** findings are present, the comment is marked with a warning emoji so the
developer knows to fix before opening a PR (where the `pre-pull-request` gate will block).

## Output

Commit comment:

```markdown
## Post-Push Review — front-backbone-rest

<!-- If no findings -->
✓ All convention checks passed. No issues found.

<!-- If findings -->
⚠️ Convention findings (non-blocking — fix before PR):

### Crítico
- `file:line` — <issue>

### Importante / Sugerencia
- <file:line> — <observation>
```
