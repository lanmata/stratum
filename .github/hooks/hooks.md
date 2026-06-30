# Hooks — front-backbone-rest

| File | Trigger | Blocking | Agents | Lifecycle Position |
|------|---------|---------|--------|--------------------|
| `pre-pull-request.hook.md` | PR opened/updated to `main` | Yes | Code Reviewer, Security Reviewer | Before merge is allowed |
| `post-push-review.hook.md` | Push to any non-main branch | No | Code Reviewer | After push, before PR |
| `post-merge-security.hook.md` | Push/merge to `main` (conditional) | No | Security Reviewer | After merge to main |

## Lifecycle Diagram

```
feature branch push
      │
      ▼
post-push-review (non-blocking)
  → code-reviewer
  → commit comment posted

      │
      ▼
PR opened to main
      │
      ▼
pre-pull-request (BLOCKING)
  → tsc --noEmit
  → test:headless
  → build:ssr
  → code-reviewer
  → security-reviewer (conditional)
  → PR comment posted
  → Crítico findings → BLOCK
  → All pass → ALLOW merge

      │
      ▼
merge to main
      │
      ▼
post-merge-security (non-blocking, conditional)
  → security-reviewer
  → commit comment or GitHub issue
```

## Condition for Security Scan Trigger

The security scan runs (in `pre-pull-request` and `post-merge-security`) when at least
one of these files is modified:
- `package.json` / `package-lock.json`
- `server/shared/proxy.js`
- `server/config/constants.js`
- `src/app/core/interceptors/auth.interceptor.ts`
- `src/app/core/interceptors/error.interceptor.ts`
- `src/app/core/guards/auth.guard.ts`
- `src/app/core/store/session/session.effects.ts`
