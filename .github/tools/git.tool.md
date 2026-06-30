---
name: git
description: Tool for git operations in front-backbone-rest (status, diff, log, blame)
type: terminal
command-prefix: git
used-by: [Orchestrator, Developer, Code Reviewer, Security Reviewer]
---

# git

## Purpose
Standard git operations for reviewing history, checking diffs, and identifying
who changed what. Used primarily by code-reviewer and security-reviewer agents.

## Available Commands

### Status and Diff
```bash
# Files changed since last commit
git status

# Full diff of unstaged changes
git diff

# Diff of staged changes
git diff --cached

# Diff of a specific file
git diff src/app/core/interceptors/auth.interceptor.ts
```

### History
```bash
# Last 10 commits with messages
git log --oneline -10

# Full log with file changes
git log --stat -5

# Changes to a specific file
git log --oneline -- server/shared/proxy.js
```

### Blame
```bash
# Who last modified each line
git blame src/app/shared/constants/api.constants.ts

# Blame a specific range
git blame -L 10,30 src/app/app.routes.ts
```

### Branch
```bash
# Current branch
git branch --show-current

# Commits ahead of main
git log --oneline main..HEAD
```

## Notes

- This project has no CI/CD or pre-commit hooks configured — changes are not automatically validated.
- The `.github/` directory contains agent infrastructure files — changes there do not affect the application.
- BFF files are under `server/` (JavaScript). Angular source is under `src/` (TypeScript).
