---
name: Developer Skills
description: Angular 20 standalone components, injectable services, NgRx session, and Express BFF proxy patterns for front-backbone-rest
applies-to: [Developer]
---

# Developer — Skill Definition

## 1. Component / Module Patterns

All components are standalone. Template is always inline. No separate `.html` or `.css` file.

```typescript
// src/app/features/<entity>/<entity>-list/<entity>-list.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EntityService } from '@core/services/<entity>.service';
import { EntityTO } from '@shared/models/<entity>.model';

@Component({
  selector: 'app-<entity>-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (error()) {
      <p class="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{{ error() }}</p>
    }
    @if (loading()) {
      <p class="text-sm text-gray-500">Loading…</p>
    } @else {
      @for (item of items(); track item.id) {
        <div>{{ item.name }}</div>
      } @empty {
        <p class="text-gray-400">No items found</p>
      }
    }
  `,
})
export class EntityListComponent implements OnInit {
  private readonly entityService = inject(EntityService);

  protected readonly items = signal<EntityTO[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.entityService.getAll().subscribe({
      next: (data) => { this.items.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load.'); this.loading.set(false); },
    });
  }
}
```

## 2. Naming Conventions

| Artifact | Pattern | Example |
|----------|---------|---------|
| Component file | `<entity>-<role>.component.ts` | `users-list.component.ts` |
| Component class | `<Entity><Role>Component` | `UsersListComponent` |
| Selector | `app-<entity>-<role>` | `app-users-list` |
| Service file | `<entity>.service.ts` | `user.service.ts` |
| Service class | `<Entity>Service` | `UserService` |
| Model file | `<entity>.model.ts` | `user.model.ts` |
| Model interface | `<Entity>TO` / `<Entity>Request` | `UserTO`, `UserCreateRequest` |
| BFF route file | `<entity>.routes.js` | `users.routes.js` |
| Feature route file | `<entity>.routes.ts` | `users.routes.ts` |
| Feature directory | `src/app/features/<entity>/` | `src/app/features/users/` |

## 3. State Management Pattern

NgRx is used **only** for session state. Local component state uses signals.

```typescript
// Reading session state — always via SessionStoreService facade
private readonly store = inject(SessionStoreService);
this.store.isAuthenticated$.subscribe(...)
this.store.token$

// Updating session state
this.store.save(token, refreshToken, user);  // dispatches saveSession
this.store.clear();                           // dispatches clearSession

// Local component state — always signals
protected readonly items = signal<T[]>([]);
protected readonly loading = signal(true);
protected readonly error = signal<string | null>(null);
```

Never dispatch NgRx actions directly from components — use `SessionStoreService`.

## 4. Routing Pattern

Config-based routing. All routes in `src/app/app.routes.ts` are lazy-loaded.

```typescript
// src/app/app.routes.ts — add new entity here
{
  path: '<entity>',
  canActivate: [authGuard],
  loadChildren: () =>
    import('./features/<entity>/<entity>.routes').then((m) => m.<entity>Routes),
},

// src/app/features/<entity>/<entity>.routes.ts
import { Routes } from '@angular/router';
export const <entity>Routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./<entity>-list/<entity>-list.component').then((m) => m.<Entity>ListComponent),
  },
];
```

## 5. Error Handling

| Error | Where handled | Effect |
|-------|--------------|--------|
| HTTP 401 | `error.interceptor.ts` | Redirect to `/auth/login` |
| HTTP 403 | `error.interceptor.ts` | Redirect to `/forbidden` |
| HTTP 502 | `server/shared/proxy.js` | Returns `{ error: 'Backend unavailable' }` |
| Observable error | Component `subscribe error:` | Set `error` signal, show inline message |

## 6. Key File Paths

```
src/app/shared/constants/api.constants.ts   ← all API paths
src/app/shared/models/                      ← TypeScript interfaces
src/app/core/services/http.service.ts       ← HTTP wrapper (do not modify)
src/app/core/services/                      ← add new <entity>.service.ts here
src/app/core/store/session/                 ← NgRx session (do not extend)
src/app/features/                           ← add new feature directory here
src/app/app.routes.ts                       ← register new lazy route here
server/routes/                              ← add new <entity>.routes.js here
server.js                                   ← register new router here
server/shared/proxy.js                      ← do not modify
server/config/constants.js                  ← add new env-vars here
src/environments/environment.ts             ← Angular build-time config
```

## 7. Constraints

- **Never** use `*ngIf` / `*ngFor` — use `@if` / `@for`
- **Never** inject `HttpClient` in components or feature services
- **Never** access `localStorage` directly — use `StorageMockService`
- **Never** hardcode URLs — use `API` constants
- **Never** add logic to BFF route handlers — delegate to `proxyToBackbone()`
- **Never** dispatch NgRx actions outside `SessionStoreService`
- **Never** use constructor injection for DI
- **Never** create a separate `.html` template file

## 8. Quality Checklist

- [ ] `npm run build:ssr` passes
- [ ] `npm run test:headless` passes
- [ ] `npx tsc --noEmit` passes (no type errors)
- [ ] No `console.log` in Angular production code
- [ ] No hardcoded URL strings
- [ ] New env-vars documented in `server/config/constants.js` with safe default
- [ ] `StorageMockService` used instead of direct `localStorage`
- [ ] All new routes lazy-loaded with `canActivate: [authGuard]`
