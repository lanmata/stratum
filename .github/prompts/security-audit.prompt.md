---
name: Security Audit
description: OWASP Top-10 security audit for front-backbone-rest — Angular 20 + Express 5 BFF, session-token auth, Redis session store
mode: agent
agent: security-reviewer
tools: [read_file, grep_search, file_search, validate_cves]
---

# Security Audit

Perform an OWASP Top-10 security audit on front-backbone-rest.

**Scope**: ${scope} (`full` / `auth-flow` / `bff-routes` / `dependencies`)
**Trigger**: ${trigger} (e.g. `pre-release` / `auth change` / `package.json updated` / `manual`)

---

## Step 1 — Run All Grep Checks

```bash
# A01 — Broken Access Control: missing authGuard
grep -n "canActivate\|loadComponent\|loadChildren" src/app/app.routes.ts

# A02 — Cryptographic: tokens in logs
grep -rn "logger\." server/ --include="*.js" | grep -i "token\|password\|secret"

# A03 — Injection: body in proxy path
grep -rn "req\.body\|req\.query" server/routes/ --include="*.js"

# A03 — Angular XSS vectors
grep -rn "eval(\|new Function(\|innerHTML\|bypassSecurityTrust" src/app/ --include="*.ts"

# A05 — CORS wildcard
grep -n "CORS_ORIGIN\|\*" server/config/constants.js server.js

# A05 — BFF console.*
grep -rn "console\." server/ --include="*.js"

# A07 — Direct localStorage (SSR bypass)
grep -rn "localStorage\." src/app/ --include="*.ts"

# A07 — session-token hardcoded outside constants
grep -rn "session-token" src/app/ --include="*.ts" | grep -v "api.constants\|auth.interceptor"

# A02 — Hardcoded secrets
grep -rn -E "(password|secret|apikey|api_key)\s*[:=]\s*['\"][^$'\"]" \
  src/ server/ --include="*.ts" --include="*.js" --exclude-dir=node_modules --exclude-dir=dist
```

---

## Step 2 — Read Key Auth Files

Read these files and verify the invariants in `.github/skills/auth-flow.skill.md`:

- `src/app/core/interceptors/auth.interceptor.ts`
- `src/app/core/interceptors/error.interceptor.ts`
- `src/app/core/guards/auth.guard.ts`
- `src/app/core/store/session/session.effects.ts`
- `src/app/app.routes.ts`
- `server/shared/proxy.js`
- `server/config/constants.js`
- `server.js`

---

## Step 3 — Run npm audit (if scope includes dependencies)

```bash
npm audit --audit-level=high --omit=dev
```

Use `validate_cves` to check findings.

---

## Step 4 — Apply OWASP Checklist

See `.github/skills/security-reviewer/SKILL.md` §3 for the full 15-item OWASP checklist.

---

## Step 5 — Produce Report

```
## Security Audit Report
Date: <today>
Scope: ${scope}
Trigger: ${trigger}

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

---

## Constraints

- Read-only — do not edit any file
- Every finding must include file path and line number
- Do not flag the Redis in-memory fallback as a vulnerability (it is intentional)
