# Security Reviewer — Skill Definition

Applies to: Security Reviewer

## 1. Threat Model

| Surface | Assets | Primary threats |
|---------|--------|----------------|
| Angular client | `session_token` in StorageMockService | XSS → token exfiltration, `bypassSecurityTrust*` misuse |
| Express BFF | Proxied user data, session tokens | SSRF via body-derived path, rate limit bypass, CORS wildcard in prod |
| backbone-rest proxy | All entity data | Unauthorized access if token not forwarded |
| Redis session store | Active session mappings | Unauthenticated Redis, session fixation |

## 2. OWASP Top-10 Grep Commands

```bash
# A01 Broken Access Control — authGuard missing from protected routes
grep -n "canActivate\|loadComponent\|loadChildren" src/app/app.routes.ts

# A02 Cryptographic Failures — sensitive data in logs
grep -rn "logger\." server/ --include="*.js" | grep -i "token\|password\|secret"

# A03 Injection — body-derived path segments in proxy routes
grep -rn "req\.body\|req\.query" server/routes/ --include="*.js"

# A03 Injection — Angular eval/innerHTML
grep -rn "eval(\|new Function(\|innerHTML\|bypassSecurityTrust" src/app/ --include="*.ts"

# A05 Misconfiguration — CORS wildcard
grep -n "CORS_ORIGIN\|\*" server/config/constants.js server.js

# A05 Misconfiguration — console.* in BFF (not using Winston)
grep -rn "console\." server/ --include="*.js"

# A07 Auth Failures — token not read from StorageMockService
grep -rn "localStorage\.getItem\|sessionStorage" src/app/ --include="*.ts"

# A07 Auth Failures — session-token header reimplemented outside interceptor
grep -rn "session-token" src/app/ --include="*.ts" | grep -v "api.constants\|auth.interceptor"

# A02 Hardcoded secrets
grep -rn -E "(password|secret|apikey|api_key)\s*[:=]\s*['\"][^$'\"]" src/ server/ \
  --include="*.ts" --include="*.js" --exclude-dir=node_modules --exclude-dir=dist
```

## 3. OWASP Checklist

- [ ] A01 — `canActivate: [authGuard]` on every protected route in `app.routes.ts`
- [ ] A01 — `/forbidden` and `/auth/**` are the only unguarded paths
- [ ] A02 — No credentials or tokens in Winston log calls
- [ ] A02 — `refreshToken` stored in `StorageMockService`, not component state
- [ ] A03 — No `eval`, `new Function`, `innerHTML`, or `bypassSecurityTrust*` in Angular
- [ ] A03 — BFF path segments built only from `req.params` — never `req.body` or `req.query`
- [ ] A04 — Rate limiter active in `server.js`, not bypassed in any route
- [ ] A05 — `CORS_ORIGIN !== '*'` in production (must be env-var in deployment)
- [ ] A05 — Winston used in BFF — no raw `console.*`
- [ ] A05 — `@ngrx/store-devtools` uses `logOnly: true`
- [ ] A06 — `npm audit --audit-level=high` returns no critical/high findings
- [ ] A07 — Token read from `StorageMockService.getItem('session_token')` in `authInterceptor`
- [ ] A07 — `logout()` calls `store.clear()` which removes token via NgRx effect
- [ ] A09 — All proxy errors logged at `error` level (no PII)
- [ ] A10 — `BACKBONE_BASE_URL` cannot be overridden by request parameters

## 4. Key File Paths

```
src/app/core/interceptors/auth.interceptor.ts    ← session-token injection
src/app/core/interceptors/error.interceptor.ts   ← 401/403 redirect
src/app/core/guards/auth.guard.ts                ← route protection
src/app/core/store/session/session.effects.ts    ← token persistence
src/app/core/services/storage-mock.service.ts    ← SSR-safe storage
src/app/app.routes.ts                            ← route guard coverage
server/shared/proxy.js                           ← proxy path construction
server/config/constants.js                       ← env-var defaults
server.js                                        ← CORS, rate limiter
```

## 5. Constraints

- Never edit files — this agent is read-only
- Do not flag the in-memory fallback for Redis as a vulnerability — it is intentional

## 6. Quality Checklist

- [ ] All grep commands from §2 executed
- [ ] OWASP checklist fully applied
- [ ] `npm audit --audit-level=high` run
- [ ] Report categorised as Critical / High / Medium / Informational
- [ ] No files modified
