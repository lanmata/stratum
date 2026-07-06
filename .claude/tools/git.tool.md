# git — Tool

Used by: Orchestrator, Developer, Code Reviewer, Security Reviewer

## Purpose
Standard git operations for reviewing history, checking diffs, and identifying who changed what.

## Available Commands

### Status and Diff
```bash
git status                                          # files changed since last commit
git diff                                            # full diff of unstaged changes
git diff --cached                                   # diff of staged changes
git diff src/app/core/interceptors/auth.interceptor.ts  # diff of a specific file
```

### History
```bash
git log --oneline -10                               # last 10 commits
git log --stat -5                                   # full log with file changes
git log --oneline -- server/shared/proxy.js         # changes to a specific file
```

### Blame
```bash
git blame src/app/shared/constants/api.constants.ts
git blame -L 10,30 src/app/app.routes.ts
```

### Branch
```bash
git branch --show-current
git log --oneline main..HEAD                        # commits ahead of main
```

## Notes

- No CI/CD or pre-commit hooks are configured — changes are not automatically validated.
- BFF files are under `server/` (JavaScript). Angular source is under `src/` (TypeScript).
- The `.claude/` directory contains agent infrastructure files — changes there do not affect the application.
