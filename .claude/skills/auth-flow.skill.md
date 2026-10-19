# Auth Flow — Shared Skill

Applies to: Developer, Security Reviewer

## Token Lifecycle

```
Login (AuthService.loginWithAlias / loginWithEmail)
  └─ POST /api/v1/session or /api/v1/session/token
      └─ Response: { token, refreshToken }
          └─ store.dispatch(saveSession({ token, refreshToken, user }))
              └─ SessionEffects.persistSession$
                  └─ StorageMockService.setItem('session_token', token)
                  └─ StorageMockService.setItem('refresh_token', refreshToken)

Every HTTP request
  └─ authInterceptor
      └─ StorageMockService.getItem('session_token')
          └─ req.clone({ headers: req.headers.set('session-token', token) })

Logout (AuthService.logout)
  └─ store.dispatch(clearSession())
      └─ SessionEffects.clearSession$
          └─ StorageMockService.removeItem('session_token')
          └─ StorageMockService.removeItem('refresh_token')
      └─ router.navigate(['/auth/login'])
```

## Key Files

| File | Role |
|------|------|
| `src/app/core/interceptors/auth.interceptor.ts` | Attaches `session-token` header to every outgoing request |
| `src/app/core/interceptors/error.interceptor.ts` | HTTP 401 → `/auth/login`, HTTP 403 → `/forbidden` |
| `src/app/core/guards/auth.guard.ts` | Route guard: reads `SessionStoreService.isAuthenticated$` |
| `src/app/core/store/session/session.effects.ts` | Persists / clears tokens in `StorageMockService` |
| `src/app/core/store/session/session.store.service.ts` | NgRx facade: `save`, `clear`, `refresh`, `isAuthenticated$` |
| `src/app/core/services/storage-mock.service.ts` | SSR-safe `localStorage` wrapper |
| `src/app/core/services/auth.service.ts` | Login, logout, refresh, JWT decode |

## StorageMockService Contract

```typescript
// CORRECT
private readonly storage = inject(StorageMockService);
const token = this.storage.getItem('session_token');
this.storage.setItem('session_token', token);
this.storage.removeItem('session_token');

// FORBIDDEN
localStorage.getItem('session_token');   // breaks SSR
```

## Route Guard Coverage

```typescript
// src/app/app.routes.ts — every protected route must have this
{
  path: 'users',
  canActivate: [authGuard],      // ← required
  loadChildren: () => import('./features/users/users.routes').then(m => m.usersRoutes),
},

// Unguarded routes (intentional)
{ path: 'auth', loadChildren: ... }    // login / register
{ path: 'forbidden', loadComponent: ... }
{ path: '**', redirectTo: 'dashboard' }
```

## Token Header Constant

```typescript
// src/app/shared/constants/api.constants.ts
export const SESSION_TOKEN_HEADER = 'session-token';

// CORRECT — use the constant
req.headers.set(SESSION_TOKEN_HEADER, token)

// FORBIDDEN — never hardcode
req.headers.set('session-token', token)   // string literal outside constants file
```

## Security Invariants

1. Token is **never** in URL parameters or query strings.
2. Token is **never** logged (neither Winston in BFF nor `console.*` in Angular).
3. `StorageMockService` is the only read/write interface to `localStorage`.
4. `SessionStoreService` is the only NgRx dispatch interface for session actions.
5. `authInterceptor` is the only place that attaches the token to outgoing requests.
