---
name: npm audit
description: Tool for scanning production and development dependency CVEs in front-backbone-rest
type: terminal
command-prefix: npm audit
used-by: [Security Reviewer, Orchestrator]
---

# npm audit

## Purpose
Scans `package-lock.json` for known CVEs in all dependencies.
Used by the security-reviewer agent during pre-release audits and after
`package.json` dependency changes.

## Available Commands

### Production dependencies only (recommended for security gate)
```bash
npm audit --audit-level=high --omit=dev
```

### All dependencies (including devDependencies)
```bash
npm audit --audit-level=high
```

### JSON output (for automated processing)
```bash
npm audit --json
```

### Fix automatically (use with caution)
```bash
# Only run if security-reviewer confirms the fix is safe
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

| Package | Role | Current version |
|---------|------|----------------|
| `express` | BFF server | ^5.2.1 |
| `jsonwebtoken` | JWT decode | ^9.0.3 |
| `axios` | Proxy HTTP client | ^1.18.1 |
| `redis` | Session store | ^6.0.1 |
| `cookie-session` | Session middleware | ^2.1.1 |
| `multer` | File upload middleware | ^2.2.0 |

## Notes

- Run `npm audit --omit=dev` to focus on packages that ship to production.
- `devDependencies` (Karma, Jasmine, TypeScript) are not present in the production BFF runtime.
- `npm audit fix --force` can introduce breaking changes — never run automatically.
