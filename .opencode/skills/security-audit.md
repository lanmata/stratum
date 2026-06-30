# Security Audit

## When to use
Before a release, after adding auth-related code, or when reviewing changes to `server/`, `src/app/core/interceptors/`, or `src/app/core/store/session/`.

## Steps

### 1. Scan for hardcoded secrets and tokens

```sh
# Passwords, tokens, API keys in source
grep -rn --include="*.ts" --include="*.js" \
  -E "(password|secret|apikey|api_key|token)\s*=\s*['\"][^$'\"]" \
  src/ server/ --exclude-dir=node_modules --exclude-dir=dist

# Hardcoded backbone-rest URL (should only appear in constants.js default)
grep -rn "backbone:8443\|https://backbone" src/ server/ \
  --exclude-dir=node_modules --exclude-dir=dist
```

Expected: zero results in Angular source. One result allowed in `server/config/constants.js` default value only.

### 2. Verify no direct localStorage access in Angular

```sh
grep -rn "localStorage\." src/app/ --include="*.ts"
```

Expected: zero results. All access must go through `StorageMockService`.

### 3. Check for console.log in production Angular code

```sh
grep -rn "console\.log\|console\.debug\|console\.warn" \
  src/app/ --include="*.ts" --exclude="*.spec.ts"
```

Expected: zero results.

### 4. Verify authGuard is applied to all protected routes

```sh
grep -n "canActivate\|loadComponent\|loadChildren" src/app/app.routes.ts
```

Confirm that every path except `/auth/**` and `/forbidden` has `canActivate: [authGuard]`.

### 5. Check for forbidden Angular control flow directives

```sh
grep -rn "\*ngIf\|\*ngFor" src/app/ --include="*.ts"
```

Expected: zero results.

### 6. Check for direct HttpClient injection

```sh
grep -rn "inject(HttpClient)\|private.*HttpClient" src/app/ --include="*.ts"
```

Expected: only in `http.service.ts`. Zero results in components or feature services.

### 7. Scan for eval, innerHTML, bypassSecurityTrust

```sh
grep -rn "eval(\|new Function(\|innerHTML\|bypassSecurityTrust" \
  src/app/ --include="*.ts"
```

Expected: zero results.

### 8. Verify BFF proxy path construction uses params only

```sh
grep -n "req\.body\|req\.query" server/routes/*.js
```

Expected: zero results — paths are built from `req.params` only. Body and query are forwarded automatically by `proxyToBackbone`.

### 9. Check for console.* usage in BFF

```sh
grep -rn "console\." server/ --include="*.js"
```

Expected: zero results. All logging must use `require('../config/logger')`.

### 10. Verify rate limiter is not bypassed

```sh
grep -n "rateLimit\|rate_limit\|skip" server/server.js server/routes/*.js
```

Confirm `rateLimit(...)` is applied in `server.js` before the route mounts.

### 11. Run npm audit

```sh
npm audit --audit-level=high
```

Review any `high` or `critical` findings in production dependencies.

## Checklist

- [ ] No hardcoded credentials or tokens in `src/` or `server/`
- [ ] `localStorage` never accessed directly in Angular (`StorageMockService` only)
- [ ] No `console.log` in production Angular code
- [ ] All protected routes have `canActivate: [authGuard]`
- [ ] No `*ngIf` / `*ngFor` (XSS risk from template injection via deprecated API)
- [ ] No direct `HttpClient` injection outside `http.service.ts`
- [ ] No `eval`, `innerHTML`, or `bypassSecurityTrust*`
- [ ] BFF route paths use `req.params` only — no body-derived path segments
- [ ] No `console.*` in BFF code (use Winston logger)
- [ ] Rate limiter active in `server.js`
- [ ] `npm audit` shows no high/critical findings in production deps

## Output report format

```
## Security Audit Report
Date: <date>
Scope: <files / features reviewed>

### Findings
| Severity | File:Line | Issue | Recommendation |
|----------|-----------|-------|----------------|
| Critical | server/routes/users.routes.js:5 | ... | ... |

### Passed Checks
- No hardcoded secrets ✓
- authGuard on all protected routes ✓
- No direct localStorage access ✓

### Manual review recommended
- <any area that grep cannot fully verify>
```
