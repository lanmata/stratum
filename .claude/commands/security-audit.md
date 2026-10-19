# Security Audit

OWASP Top-10 security audit for front-backbone-rest.

**Usage:** `/security-audit [scope]`

Example: `/security-audit full`
Example: `/security-audit auth-flow`
Example: `/security-audit bff-routes`
Example: `/security-audit dependencies`

---

Agent: security-reviewer

Read `.claude/skills/security-reviewer.skill.md` and `.claude/skills/auth-flow.skill.md` before starting. This agent is read-only — do not edit any file.

## Input (from $ARGUMENTS)

`$ARGUMENTS` is the scope: `full` / `auth-flow` / `bff-routes` / `dependencies`. Default: `full`.

## Step 1 — Run All Grep Checks

```bash
# A01 — Broken Access Control
grep -n "canActivate\|loadComponent\|loadChildren" src/app/app.routes.ts

# A02 — Tokens in logs
grep -rn "logger\." server/ --include="*.js" | grep -i "token\|password\|secret"

# A03 — Injection via body in BFF path
grep -rn "req\.body\|req\.query" server/routes/ --include="*.js"

# A03 — Angular XSS vectors
grep -rn "eval(\|new Function(\|innerHTML\|bypassSecurityTrust" src/app/ --include="*.ts"

# A05 — CORS wildcard
grep -n "CORS_ORIGIN\|\*" server/config/constants.js server.js

# A05 — console.* in BFF
grep -rn "console\." server/ --include="*.js"

# A07 — Direct localStorage
grep -rn "localStorage\." src/app/ --include="*.ts"

# A07 — session-token outside constants/interceptor
grep -rn "session-token" src/app/ --include="*.ts" | grep -v "api.constants\|auth.interceptor"

# A02 — Hardcoded secrets
grep -rn -E "(password|secret|apikey|api_key)\s*[:=]\s*['\"][^$'\"]" \
  src/ server/ --include="*.ts" --include="*.js" --exclude-dir=node_modules --exclude-dir=dist
```

## Step 2 — Read Key Auth Files (if scope includes auth-flow or full)

- `src/app/core/interceptors/auth.interceptor.ts`
- `src/app/core/interceptors/error.interceptor.ts`
- `src/app/core/guards/auth.guard.ts`
- `src/app/core/store/session/session.effects.ts`
- `src/app/app.routes.ts`
- `server/shared/proxy.js`
- `server/config/constants.js`
- `server.js`

## Step 3 — Run npm audit (if scope includes dependencies or full)

```bash
npm audit --audit-level=high --omit=dev
```

## Step 4 — Apply OWASP Checklist

See `.claude/skills/security-reviewer.skill.md` §3 for the full checklist.

## Step 5 — Produce Report

```
## Security Audit Report
Date: <today>
Scope: <scope>

### Critical
- `file:line` — <issue and recommendation>

### High
- `file:line` — <issue>

### Medium / Informational
- <file:line> — <observation>

### Passed
- A01: authGuard on all protected routes ✓/✗
- A03: No injection vectors in BFF paths ✓/✗
- A07: Token only in StorageMockService ✓/✗
- npm audit: N high/critical findings
```

## Constraints

- Read-only — do not edit any file
- Every finding must include file path and line number
- Do not flag the Redis in-memory fallback as a vulnerability (it is intentional)
