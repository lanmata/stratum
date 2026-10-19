# API Contract — Shared Skill

Applies to: Developer, API Designer

## Path Prefix Rule

| Layer | Prefix | Example |
|-------|--------|---------|
| Angular `API` constant | `/v1/` | `'/v1/users'` |
| `HttpService` base | `/api` | `environment.apiBaseUrl = '/api'` |
| Full Angular request URL | `/api/v1/` | `/api/v1/users` |
| BFF `server.js` mount | `/api/v1/` | `app.use('/api/v1/users', usersRoutes)` |
| BFF `proxyToBackbone` path | `/api/v1/` | `'/api/v1/users'` → backbone-rest |

The `/api` prefix is added automatically by `HttpService`. Never include it in `API` constants.

## `API` Object Structure

```typescript
export const API = {
  SESSION: {
    ROOT: '/v1/session',
    TOKEN: '/v1/session/token',
    VALIDATE: '/v1/session/validate',
    RENEW: '/v1/session/renew',
    REFRESH: '/v1/session/refresh',
  },
  USERS: {
    ROOT: '/v1/users',
    BY_ID: (id: string) => `/v1/users/user/${id}`,
    BY_APPLICATION: (appId: string) => `/v1/users/application/${appId}`,
    LINK_ROLE: (userId: string, roleId: string) =>
      `/v1/users/link/user/${userId}/role/${roleId}`,
  },
  // ... one block per entity
} as const;
```

**Rules:**
- `as const` at the end of the `API` object — never omit it
- Static paths: string literals
- Dynamic paths: `(param: string) => \`/v1/...\`` — typed arrow functions
- Key names: `SCREAMING_SNAKE_CASE`, descriptive (`BY_APPLICATION`, `LINK_ROLE`)

## TypeScript Model Conventions

```typescript
// src/app/shared/models/<entity>.model.ts
// Response/read interface — suffix TO (Transfer Object)
export interface UserTO {
  id: string;
  alias: string;
  active: boolean;
}

// Create request — suffix CreateRequest
export interface UserCreateRequest {
  alias: string;
  email: string;
  applicationId: string;
}

// Update request — suffix UpdateRequest or PutRequest
export interface PutUserUpdateRequest {
  displayName: string;
  active: boolean;
}
```

## Service Method → API Constant Mapping

```typescript
// CORRECT
getById(id: string): Observable<UserTO> {
  return this.http.get<UserTO>(API.USERS.BY_ID(id));
}

create(req: UserCreateRequest): Observable<UserCreateResponse> {
  return this.http.post<UserCreateResponse>(API.USERS.ROOT, req);
}

// FORBIDDEN
this.http.get<UserTO>(`/v1/users/user/${id}`)  // hardcoded path
this.http.get<UserTO>('/api/v1/users/user/' + id)  // wrong prefix + concatenation
```

## Adding a New Entity Contract (in order)

1. Add `export interface <Entity>TO { ... }` to `src/app/shared/models/<entity>.model.ts`
2. Add `export interface <Entity>CreateRequest { ... }` to the same file
3. Add `<ENTITY>: { ROOT, BY_ID, ... }` block to `API` in `api.constants.ts`
4. Create `server/routes/<entity>.routes.js`
5. Register router in `server.js`
