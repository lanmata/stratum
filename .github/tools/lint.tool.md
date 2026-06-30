---
name: Prettier
description: Tool for code formatting in front-backbone-rest (Prettier via package.json config, no ESLint)
type: terminal
command-prefix: npx prettier
used-by: [Code Reviewer, Developer]
---

# Prettier (Formatting)

## Purpose
front-backbone-rest uses Prettier for code formatting. There is no ESLint configured.
TypeScript strict mode is the sole static analysis gate.

## Configuration (from `package.json`)

```json
{
  "prettier": {
    "printWidth": 100,
    "singleQuote": true,
    "overrides": [
      {
        "files": "*.html",
        "options": { "parser": "angular" }
      }
    ]
  }
}
```

## Available Commands

### Check formatting (no changes — for review)
```bash
npx prettier --check "src/**/*.ts" "server/**/*.js"
```

### Format files in-place
```bash
# Format all TypeScript source
npx prettier --write "src/**/*.ts"

# Format BFF JavaScript
npx prettier --write "server/**/*.js"

# Format a single file
npx prettier --write src/app/features/users/users-list/users-list.component.ts
```

## Key Rules Enforced

| Rule | Value |
|------|-------|
| Max line length | 100 characters |
| Quotes | Single quotes (`'`) — except HTML attribute values |
| HTML parser | Angular (for inline template strings) |
| Trailing commas | Default Prettier behaviour |
| Semicolons | Default Prettier behaviour |

## Notes

- There is no `npm run lint` or `npm run format` script — use `npx prettier` directly.
- No `.prettierrc` file — config lives in `package.json` under `"prettier"`.
- No `.eslintrc` or `eslint.config.*` — ESLint is not used in this project.
- The code-reviewer agent uses this for formatting checks — it does not auto-fix.
