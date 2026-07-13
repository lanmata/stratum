# Stratum — YouTrack Issues

> Implementación completa del backoffice: CRUD de usuarios, roles, features, tipos de contacto, aplicaciones y clientes M2M.
> Orden de implementación recomendado: STR-01 → STR-02 → STR-03 → STR-04 → STR-05 → STR-06 → STR-07 → STR-08.

---

## STR-01 — Componentes Compartidos (ConfirmDialog + Toast)

**Type:** Task | **Priority:** Critical | **Blocks:** STR-02, STR-03, STR-04, STR-05, STR-06, STR-07

### Summary

Implement shared UI infrastructure: ConfirmDialog and Toast components

### Description

Create the reusable UI foundation required by all CRUD modules. Nothing else can be built until this is in place.

**Files to create:**
- `src/app/shared/models/toast.model.ts` — `Toast` interface + `ToastType`
- `src/app/core/services/toast.service.ts` — signal-based notification stack
- `src/app/shared/components/confirm-dialog/confirm-dialog.component.ts` — generic confirmation modal
- `src/app/shared/components/toast/toast.component.ts` — root notification renderer

**Files to modify:**
- `src/app/app.html` — add `<app-toast />` once alongside `router-outlet`

**`ToastService` API:**

| Method | Default duration |
|---|---|
| `success(message, duration?)` | 4000 ms |
| `error(message, duration?)` | 8000 ms (0 = manual dismiss) |
| `info(message, duration?)` | 4000 ms |
| `dismiss(id)` | — |

`toasts` exposed as `Signal<Toast[]>` (readonly).

**`ConfirmDialogComponent` inputs/outputs:**

| API | Type | Default |
|---|---|---|
| `title` | `input<string>()` | "Confirmar acción" |
| `message` | `input.required<string>()` | — |
| `confirmLabel` | `input<string>()` | "Confirmar" |
| `cancelLabel` | `input<string>()` | "Cancelar" |
| `confirmStyle` | `input<'danger' \| 'primary'>()` | 'danger' |
| `confirmed` | `output<void>()` | — |
| `cancelled` | `output<void>()` | — |

Component is used inline in the parent template controlled by a local signal — no overlay service or CDK portal.

**Technical notes:**
- Toast IDs via `crypto.randomUUID()`.
- Auto-dismiss managed with `setTimeout`; `dismiss()` must call `clearTimeout` to prevent memory leaks.
- Tailwind color classes: `bg-green-500` (success), `bg-red-500` (error), `bg-blue-500` (info).
- `ConfirmDialog` closes on `Escape` keydown.

### Acceptance Criteria

- [ ] Clicking "Cancelar" or pressing Escape closes the modal without side effects
- [ ] Clicking "Confirmar" emits `confirmed`; parent executes the action
- [ ] `success()` toast disappears after 4 s
- [ ] `error()` toast persists 8 s or until manual dismiss
- [ ] Multiple toasts stack without overlapping; manual ✕ dismiss works on all types
- [ ] Both components are `standalone: true` and SSR-safe
- [ ] `<app-toast />` registered exactly once in the root layout

---

## STR-02 — Tipos de Contacto: CRUD completo

**Type:** Feature | **Priority:** High | **Depends on:** STR-01

### Summary

Implement Contact Types module — full CRUD (list, create, edit, delete)

### Description

New module to manage the catalog of contact types (email, phone, address, etc.). This is the simplest complete CRUD in the project and serves as the reference pattern for all others.

**Files to create:**
- `server/routes/contact-types.routes.js` — BFF proxy routes
- `src/app/core/services/contact-type.service.ts`
- `src/app/features/contact-types/contact-types-list/contact-types-list.component.ts`
- `src/app/features/contact-types/contact-type-form/contact-type-form.component.ts`
- `src/app/features/contact-types/contact-types.routes.ts`

**Files to modify:**
- `server.js` — mount `app.use('/api/v1/contact-types', contactTypesRoutes)`
- `src/app/shared/models/contact.model.ts` — add `description?: string` to `ContactType`; add `ContactTypeRequest` envelope
- `src/app/shared/constants/api.constants.ts` — add `CONTACT_TYPES` group
- `src/app/app.routes.ts` — add lazy route `/contact-types`

**BFF routes:**

| Verb | Express path | Upstream |
|---|---|---|
| `POST` | `/` | `/api/v1/contact-types/` |
| `GET` | `/list-all` | `/api/v1/contact-types/list-all` |
| `GET` | `/:contactTypeId` | `/api/v1/contact-types/:contactTypeId` |
| `PUT` | `/:contactTypeId` | `/api/v1/contact-types/:contactTypeId` |
| `DELETE` | `/:contactTypeId` | `/api/v1/contact-types/:contactTypeId` |

**Form fields:** `name` (required, maxLength 128), `description` (optional, maxLength 512), `active` (toggle, default true).

**Technical notes:**
- `DELETE /:contactTypeId` returns the deleted `ContactType` object (not 204) — service signature is `Observable<ContactType>`.
- Use `FormBuilder.nonNullable.group` following the `LoginComponent` pattern.
- `ContactTypeRequest` envelope: `{ contactType, dateTime?, appName?, appToken? }` — envelope fields optional from the frontend.

### Acceptance Criteria

- [ ] List shows name, description, active badge, and Edit/Delete actions
- [ ] "Nuevo Tipo de Contacto" navigates to creation form
- [ ] Form blocks submit if `name` is empty
- [ ] Successful create → success toast → redirect to list
- [ ] Edit form pre-fills current data; success → toast → redirect
- [ ] Delete shows `ConfirmDialog`; confirm removes record and shows toast; cancel is a no-op
- [ ] API errors show error toast with descriptive message
- [ ] `LoadingService` indicator active during HTTP calls

---

## STR-03 — Roles: formularios Crear/Editar

**Type:** Feature | **Priority:** High | **Depends on:** STR-01

### Summary

Add create and edit forms to the Roles module (BFF and service already complete)

### Description

The BFF and `RoleService` are fully implemented. Only the UI layer is missing. No delete functionality — `DELETE /api/v1/roles/{roleId}` does not exist in backbone-rest and must not be implemented.

**Files to create:**
- `src/app/features/roles/role-form/role-form.component.ts`

**Files to modify:**
- `src/app/features/roles/roles.routes.ts` — add `new` and `:roleId/edit` routes
- `src/app/features/roles/roles-list/roles-list.component.ts` — add "Nuevo Rol" button + "Acciones" column (Edit link only)
- `src/app/shared/constants/api.constants.ts` — add `ROLES.UPDATE: (id: string) => \`/v1/roles/${id}\``

**RoleFormComponent behavior:**
- Detect mode via `ActivatedRoute.snapshot.paramMap.get('roleId')`.
- Edit mode: pre-fill from `roleService.getById(roleId)`.
- Fields: `name` (required, maxLength 128), `description` (optional, maxLength 512), `active` (toggle).
- The `features[]` array on the role model is **not edited** in this form.
- Submit: `create()` or `update()` → toast → navigate to `/roles`.

**Technical notes:**
- `RoleRequest` wraps the role object. In `update()`, the role must include the existing `id`.
- Use `FormBuilder.nonNullable.group` following the `LoginComponent` pattern.

### Acceptance Criteria

- [ ] List shows "Nuevo Rol" button and "Acciones" column with "Editar" link per row
- [ ] No "Eliminar" button anywhere in this module
- [ ] Create form blocks submit if `name` empty
- [ ] Success → toast + redirect to `/roles` for both create and edit
- [ ] Edit form loads current role data
- [ ] Cancel navigates to `/roles` without saving
- [ ] API errors show error toast

---

## STR-04 — Features: formularios Crear/Editar + corrección de bug

**Type:** Feature | **Priority:** High | **Depends on:** STR-01

### Summary

Add create and edit forms to the Features module; fix hardcoded path bug in FeatureService

### Description

Same pattern as Roles. BFF and service are complete except for a bug in `FeatureService.create()` that uses a hardcoded path instead of the `API` constant. Fix must ship together with the UI.

No delete functionality — `DELETE /api/v1/features/{featureId}` does not exist in backbone-rest.

**Bug fix — `src/app/core/services/feature.service.ts`:**

```typescript
// BEFORE (bug — hardcoded path)
create(req: FeatureRequest): Observable<Feature> {
  return this.http.post<Feature>('/v1/features/', req);
}

// AFTER (correct)
create(req: FeatureRequest): Observable<Feature> {
  return this.http.post<Feature>(API.FEATURES.ROOT, req);
}
```

**Files to create:**
- `src/app/features/features-mgmt/feature-form/feature-form.component.ts`

**Files to modify:**
- `src/app/core/services/feature.service.ts` — fix hardcoded path in `create()`
- `src/app/features/features-mgmt/features-mgmt.routes.ts` — add `new` and `:featureId/edit` routes
- `src/app/features/features-mgmt/features-list/features-list.component.ts` — add "Nueva Feature" button + "Acciones" column
- `src/app/shared/constants/api.constants.ts` — add `FEATURES.ROOT` and `FEATURES.UPDATE: (id) => \`/v1/features/${id}\``

### Acceptance Criteria

- [ ] `FeatureService.create()` uses `API.FEATURES.ROOT` (bug fixed)
- [ ] List shows "Nueva Feature" button and "Acciones" column with "Editar" link per row
- [ ] No "Eliminar" button anywhere in this module
- [ ] Create form blocks submit if `name` empty
- [ ] Success → toast + redirect to `/features-mgmt` for both create and edit
- [ ] Edit form loads current feature data
- [ ] API errors show error toast
- [ ] Unit test for `FeatureService.create()` updated if it exists

---

## STR-05 — Usuarios: CRUD completo + gestión de roles

**Type:** Feature | **Priority:** High | **Depends on:** STR-01, STR-03

### Summary

Add create, edit, delete UI and role management to the Users module (BFF and service already complete)

### Description

The most complex module. BFF and `UserService` are fully implemented. Only the UI layer is missing. Requires a multi-section form, async alias/email availability validators, and individual role link/unlink operations.

**Files to create:**
- `src/app/features/users/user-form/user-form.component.ts`

**Files to modify:**
- `src/app/features/users/users.routes.ts` — add `new` and `:userId/edit` routes
- `src/app/features/users/users-list/users-list.component.ts` — add "Nuevo Usuario" button + Edit/Delete actions per row

**Create mode fields (required):** `alias`, `email`, `password` (min 8 chars), `displayName`, `roleId` (select from `RoleService.getAll(true)`), `applicationId` (readonly from `API.APPLICATION.ID`), `firstName`, `lastName`.

**Create mode fields (optional):** `middleName`, `gender` (M/F/O select), `birthdate`, `notificationEmail`, `notificationSms`, `privacyDataOutActive`.

**Async validators (debounce 400 ms):** `alias` → `userService.checkAlias(alias, applicationId)`; `email` → `userService.checkEmail(email, applicationId)`. 200 = available, 404 = taken.

**Edit mode — 4 sections:**

1. **Basic data** — `alias` readonly, `displayName`, `active`, notification/privacy toggles
2. **Change password** — collapsed by default; only sent if user fills it
3. **Person data** — `firstName`, `middleName`, `lastName`, `gender`, `birthdate`
4. **Role management** — checkboxes for all available roles; current roles pre-checked; changes executed individually via `linkRole()` / `unlinkRole()` on save

**Delete confirmation message:**
> ¿Eliminar al usuario "[alias]"? Esta acción no se puede deshacer y eliminará todos sus datos asociados.

**Technical notes:**
- Delete uses `userService.delete(applicationId, userId)` where `applicationId = API.APPLICATION.ID`.
- `PutUserUpdateRequest.application` requires the full `Application` object, not just the ID.
- Role changes in edit use dedicated `linkRole`/`unlinkRole` endpoints — not `update()` with `roleIds[]`.

### Acceptance Criteria

- [ ] List has "Nuevo Usuario" button and Edit/Delete actions per row
- [ ] `alias` and `email` show real-time availability feedback during creation
- [ ] Form blocks submit on validation errors
- [ ] Successful create → user in list → success toast
- [ ] Edit form shows `alias` as readonly
- [ ] Current user roles are pre-checked in role management section
- [ ] Role changes on save trigger individual link/unlink calls
- [ ] Delete shows confirmation dialog with user's alias; confirm removes user; cancel is a no-op
- [ ] Password field in edit only sent if filled
- [ ] API errors show descriptive error toast

---

## STR-06 — Aplicaciones: módulo de creación (restricción de API)

**Type:** Feature | **Priority:** Medium | **Depends on:** STR-01

### Summary

Implement Applications module — creation only (backbone-rest API limitation)

### Description

New module with a hard API constraint: backbone-rest only exposes `POST /api/v1/applications`. No list, get-by-id, update, or delete endpoints exist. The module is implemented as create-only with an informational placeholder for the list view.

> **API restriction:** `GET`, `PUT`, and `DELETE` for `/api/v1/applications` do not exist. The list view shows an informational banner. Edit and delete are not implemented.

**Files to create:**
- `server/routes/applications.routes.js` — POST only
- `src/app/core/services/application.service.ts` — `create()` implemented; future methods stubbed as TODOs
- `src/app/features/applications/applications-list/applications-list.component.ts` — placeholder + "Nueva Aplicación" button
- `src/app/features/applications/application-form/application-form.component.ts` — create only
- `src/app/features/applications/applications.routes.ts`

**Files to modify:**
- `server.js` — mount `app.use('/api/v1/applications', applicationsRoutes)`
- `src/app/shared/models/application.model.ts` — fix `ApplicationCreateRequest` envelope: `{ application: { name, description?, active? }, dateTime?, appName?, appToken? }`
- `src/app/shared/constants/api.constants.ts` — add `APPLICATIONS.ROOT`
- `src/app/app.routes.ts` — add lazy route `/applications`

**Placeholder banner text:**
> ℹ️ La gestión completa de aplicaciones estará disponible cuando la API backbone-rest exponga los endpoints de consulta y actualización.

**Post-creation toast:** `✅ Aplicación creada. ID: [id]` with a "Copiar" button — the application ID is critical for configuring other modules.

**Technical notes:**
- The created application ID must be prominently displayed and copyable via `navigator.clipboard.writeText()`.
- Future service methods (`getAll`, `getById`, `update`, `delete`) must be documented as `// TODO: implement when API exposes GET/PUT/DELETE /api/v1/applications`.

### Acceptance Criteria

- [ ] List view shows the informational banner about the API limitation
- [ ] "Nueva Aplicación" button navigates to the create form
- [ ] Form blocks submit if `name` is empty
- [ ] Successful create shows toast with the new application ID and a copy button
- [ ] No edit or delete UI exists
- [ ] API errors show error toast

---

## STR-07 — Clientes Gestionados (M2M OAuth2): módulo completo

**Type:** Feature | **Priority:** Medium | **Depends on:** STR-01

### Summary

Implement full Managed Clients (M2M OAuth2) module — list, create, edit, delete, secret rotation, token revocation

### Description

Entirely new module. Highest-effort item: new BFF, new service, new models, and complex UI including a security-critical one-time secret display dialog.

**Files to create:**
- `server/routes/managed-clients.routes.js`
- `src/app/shared/models/managed-client.model.ts`
- `src/app/core/services/managed-client.service.ts`
- `src/app/features/managed-clients/managed-clients-list/managed-clients-list.component.ts`
- `src/app/features/managed-clients/managed-client-form/managed-client-form.component.ts`
- `src/app/features/managed-clients/managed-client-secret-dialog/managed-client-secret-dialog.component.ts`
- `src/app/features/managed-clients/managed-clients.routes.ts`

**Files to modify:**
- `server.js` — mount `app.use('/api/v1/managed-clients', managedClientsRoutes)`
- `src/app/shared/constants/api.constants.ts` — add `MANAGED_CLIENTS` group
- `src/app/app.routes.ts` — add lazy route `/managed-clients`

**BFF routes:**

| Verb | Path | Notes |
|---|---|---|
| `POST /` | Create client | |
| `GET /` | List | Forward `req.query` (applicationId, active, page, size) |
| `GET /:clientId` | Get by ID | |
| `PUT /:clientId` | Update | |
| `DELETE /:clientId` | Delete | |
| `POST /:clientId/rotate-secret` | Rotate secret | Returns plaintext secret |
| `DELETE /:clientId/tokens` | Revoke all tokens | |

**List filters (local signals):** `filterApplicationId`, `filterActive`, `page`, `size`.

**List columns:** Name, ApplicationId (truncated + tooltip), Scopes (chips), Active badge, Last updated, Secret rotated at, Actions.

**Row actions:**

| Action | Flow |
|---|---|
| Edit | Navigate to `/:clientId/edit` |
| Rotate Secret | `ConfirmDialog` → `rotateSecret()` → `ManagedClientSecretDialog` |
| Revoke Tokens | `ConfirmDialog` → `revokeAllTokens()` → toast |
| Delete | `ConfirmDialog` → `delete()` → refresh list → toast |

**Scopes field:** chip input — user types a scope and presses Enter or comma to add; ✕ removes chips.

**`ManagedClientSecretDialogComponent` (security-critical):**
- Modal is **blocking** — no ✕ button, no click-outside-to-close.
- Red banner: "Este secreto no volverá a mostrarse".
- Monospaced secret field with dark background.
- "Copiar" button via `navigator.clipboard.writeText()`.
- Checkbox: "He guardado el secreto de forma segura" — must be checked to enable the close button.
- For rotation: also show `gracePeriodSeconds` so the operator knows when the old secret expires.
- On close: immediately clear `clientSecret` from component state — do not persist in NgRx store, localStorage, or any shared state.

**Technical notes:**
- `navigator.clipboard` requires HTTPS or localhost. Add a manual text-selection fallback for HTTP dev environments.
- Scopes are arbitrary strings — no predefined enum.

### Acceptance Criteria

- [ ] List shows clients with working applicationId and active filters and page/size pagination
- [ ] Create shows `ManagedClientSecretDialog` with the plaintext `clientSecret`
- [ ] Secret dialog cannot be closed without checking the confirmation checkbox
- [ ] "Copiar" copies secret to clipboard
- [ ] Rotate secret: confirmation → dialog with new secret and grace period info
- [ ] Revoke tokens: confirmation → success toast
- [ ] Delete: confirmation → client removed from list → toast
- [ ] Edit form shows `applicationId` as readonly
- [ ] `clientSecret` is not retained in app state after dialog close
- [ ] API errors show descriptive error toast

---

## STR-08 — Dashboard: agregar navegación para módulos nuevos

**Type:** Task | **Priority:** Low | **Depends on:** STR-02, STR-06, STR-07

### Summary

Add navigation cards and lazy routes for Applications, Managed Clients, and Contact Types to the Dashboard

### Description

Minimal change — two files only. Adds three new navigation cards to `DashboardComponent` and three protected lazy routes to `app.routes.ts`.

**Files to modify:**
- `src/app/features/dashboard/dashboard.component.ts` — add 3 nav items
- `src/app/app.routes.ts` — add 3 lazy routes with `authGuard`

**New nav items to add:**

```typescript
{ path: '/applications',    icon: '🏢', label: 'Aplicaciones',      description: 'Registrar aplicaciones del sistema' },
{ path: '/managed-clients', icon: '🤖', label: 'Clientes M2M',      description: 'Clientes OAuth2 machine-to-machine' },
{ path: '/contact-types',   icon: '🏷️', label: 'Tipos de Contacto', description: 'Catálogo de tipos de contacto' },
```

**New routes to add (before the `**` catch-all):**

```typescript
{
  path: 'applications',
  canActivate: [authGuard],
  loadChildren: () =>
    import('./features/applications/applications.routes').then(m => m.applicationsRoutes),
},
{
  path: 'managed-clients',
  canActivate: [authGuard],
  loadChildren: () =>
    import('./features/managed-clients/managed-clients.routes').then(m => m.managedClientsRoutes),
},
{
  path: 'contact-types',
  canActivate: [authGuard],
  loadChildren: () =>
    import('./features/contact-types/contact-types.routes').then(m => m.contactTypesRoutes),
},
```

**Technical notes:**
- `authGuard` already implemented at `src/app/core/guards/auth.guard.ts` — reuse without changes.
- Verify that each module's route file exports the correct name (`applicationsRoutes`, `managedClientsRoutes`, `contactTypesRoutes`) so the `import().then(m => m.xxx)` resolves correctly.

### Acceptance Criteria

- [ ] Dashboard shows 9 cards (6 existing + 3 new)
- [ ] Each new card navigates to its correct route
- [ ] All 3 new routes are protected by `authGuard` — unauthenticated access redirects to `/auth/login`
- [ ] New cards match the visual style of existing cards
