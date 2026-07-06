# npm audit — Tool

Used by: Security Reviewer, Orchestrator

## Purpose
Scans `package-lock.json` for known CVEs. Used during pre-release audits and after
`package.json` dependency changes.

## Available Commands

```bash
# Production dependencies only (recommended for security gate)
npm audit --audit-level=high --omit=dev

# All dependencies including devDependencies
npm audit --audit-level=high

# JSON output for automated processing
npm audit --json

# Fix automatically — only run if security-reviewer confirms it is safe
npm audit fix
```

## Severity Levels

| Level | Action |
|-------|--------|
| critical | Block — must fix before any release |
| high | Block — must fix before merge to main |
| moderate | Flag — fix if a patch is available |
| low / info | Note in report — no blocking action |

## Key Dependencies to Watch

| Package | Role | Version |
|---------|------|---------|
| `express` | BFF server | ^5.2.1 |
| `jsonwebtoken` | JWT decode | ^9.0.3 |
| `axios` | Proxy HTTP client | ^1.18.1 |
| `redis` | Session store | ^6.0.1 |
| `cookie-session` | Session middleware | ^2.1.1 |
| `multer` | File upload middleware | ^2.2.0 |

## Notes

- Run `--omit=dev` to focus on packages that ship to production.
- `npm audit fix --force` can introduce breaking changes — never run automatically.
- `devDependencies` (Karma, Jasmine, TypeScript) are not present in the production BFF runtime.
