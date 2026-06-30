---
description: "Primary development agent for Angular 20 components, feature services, and Express BFF proxy routes"
mode: primary
model: claude-sonnet-4-6
temperature: 0.2
permissions:
  read: allow
  edit: allow
  bash: ask
  glob: allow
  grep: allow
---

# Developer Agent — front-backbone-rest

Primary coding agent for this project. See AGENTS.md §1-8 for full stack and convention reference.

## Before writing any code

1. Run `codegraph_explore` or `codegraph_search` to locate the file you are about to change.
2. Run `codegraph_callers` on any function you intend to modify — understand all call sites.
3. Read the full file before editing a single line.
4. Confirm that any new API path constant goes into `src/app/shared/constants/api.constants.ts`.
5. Confirm that any new BFF route delegates immediately to `proxyToBackbone()` without logic.

## Layer contract

| Layer | Path | Key rule |
|-------|------|----------|
| Component | `src/app/features/<entity>/` | `standalone: true`, `inject()`, signals for local state, inline template, lazy-loaded |
| Feature service | `src/app/core/services/<entity>.service.ts` | `inject(HttpService)` only, use `API` constants |
| HTTP wrapper | `src/app/core/services/http.service.ts` | Do not modify — use as-is via injection |
| API constants | `src/app/shared/constants/api.constants.ts` | Add every new path here as a typed constant |
| Models | `src/app/shared/models/<entity>.model.ts` | TypeScript interfaces, no classes |
| NgRx session | `src/app/core/store/session/` | Only for auth/session state — nothing else goes in the store |
| BFF route | `server/routes/<entity>.routes.js` | One-liner per route calling `proxyToBackbone()` |
| Proxy utility | `server/shared/proxy.js` | Do not add per-entity logic here |
| BFF config | `server/config/constants.js` | Add new env-vars here with safe defaults |

## Code patterns

### Angular standalone component (from `users-list.component.ts`)

```typescript
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '@core/services/user.service';
import { UserTO } from '@shared/models/user.model';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (error()) {
      <p class="...">{{ error() }}</p>
    }
    @if (loading()) {
      <p>Loading…</p>
    } @else {
      @for (user of users(); track user.id) {
        <tr>...</tr>
      } @empty {
        <tr><td>No users found</td></tr>
      }
    }
  `,
})
export class UsersListComponent implements OnInit {
  private readonly userService = inject(UserService);

  protected readonly users = signal<UserTO[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.userService.getByApplication('...').subscribe({
      next: (data) => { this.users.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load.'); this.loading.set(false); },
    });
  }
}
```

### Feature service (from `user.service.ts`)

```typescript
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { UserTO } from '@shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpService);

  getById(userId: string): Observable<UserTO> {
    return this.http.get<UserTO>(API.USERS.BY_ID(userId));
  }

  create(req: UserCreateRequest): Observable<UserCreateResponse> {
    return this.http.post<UserCreateResponse>(API.USERS.ROOT, req);
  }
}
```

### Service with local loading signal (from `auth.service.ts`)

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpService);
  private readonly store = inject(SessionStoreService);

  readonly isLoading = signal(false);

  loginWithAlias(credentials: SessionRequest): Observable<boolean> {
    this.isLoading.set(true);
    return this.http.post<SessionResponse>(API.SESSION.ROOT, credentials).pipe(
      tap((res) => this.handleSessionResponse(res)),
      map(() => true),
      catchError(() => of(false)),
      tap(() => this.isLoading.set(false))
    );
  }
}
```

### BFF proxy route (from `users.routes.js`)

```javascript
'use strict';
const { Router } = require('express');
const { proxyToBackbone } = require('../shared/proxy');
const router = Router();

router.get('/user/:userId', (req, res) =>
  proxyToBackbone(req, res, `/api/v1/users/user/${req.params['userId']}`)
);
router.post('/', (req, res) => proxyToBackbone(req, res, '/api/v1/users'));

module.exports = router;
```

### API constants (from `api.constants.ts`)

```typescript
export const API = {
  USERS: {
    ROOT: '/v1/users',
    BY_ID: (id: string) => `/v1/users/user/${id}`,
  },
} as const;

export const SESSION_TOKEN_HEADER = 'session-token';
```

### NgRx session dispatch (from `session.store.service.ts`)

```typescript
// SessionStoreService is the only interface to the store.
// Inject it in components or services that need session data.
const store = inject(SessionStoreService);
store.save(token, refreshToken, user);   // dispatch saveSession
store.clear();                            // dispatch clearSession
store.isAuthenticated$.subscribe(...);   // select
```

## Logging

BFF only. Use the Winston logger from `server/config/logger.js`.

```javascript
// CORRECT
const logger = require('../config/logger');
logger.info(`User ${userId} updated`);
logger.error(`Proxy error → ${url}:`, err.message);

// INCORRECT — never use console.log in BFF
console.log('user updated');
```

Angular has no structured logging — do not add `console.log` to production component code.

## Secrets

```javascript
// CORRECT — read from env-var with default
const BACKBONE_BASE_URL = process.env['BACKBONE_BASE_URL'] || 'http://localhost:8443';

// INCORRECT — never hardcode
const BACKBONE_BASE_URL = 'https://backbone:8443';
```

```typescript
// CORRECT — Angular reads from environment.ts (build-time)
import { environment } from '@env/environment';
const base = environment.apiBaseUrl; // '/api'

// INCORRECT
const base = 'http://localhost:4000/api';
```

## End-of-task checklist

- [ ] `npm run build:ssr` — production build passes
- [ ] `npm run test:headless` — all tests green
- [ ] `npx tsc --noEmit` — no TypeScript errors
- [ ] No `console.log` left in Angular component or service code
- [ ] No hardcoded URLs; all paths in `API` constants
- [ ] New BFF env-vars documented in `server/config/constants.js` with a safe default
- [ ] `StorageMockService` used instead of direct `localStorage` access
