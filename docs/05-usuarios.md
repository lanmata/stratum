# Usuarios — Requisitos de Implementación

> El módulo más complejo del backoffice. El servicio y el BFF están completamente implementados. Solo falta la capa UI: formularios de creación, edición, eliminación y asignación de roles.

---

## 1. Estado Actual

| Elemento | Estado | Detalle |
|---|---|---|
| Rutas BFF | ✅ Completo | `server/routes/users.routes.js` — todos los endpoints |
| `UserService` | ✅ Completo | `create`, `update`, `updateFull`, `delete`, `linkRole`, `unlinkRole`, validaciones |
| Modelos | ✅ Completo | `UserTO`, `UserCreateRequest`, `PutUserUpdateRequest`, etc. |
| Constantes API | ✅ Completo | `API.USERS` tiene todos los path-builders |
| Componente lista | ⚠️ Parcial | `UsersListComponent` muestra datos — sin botón "Nuevo" ni acciones por fila |
| Formularios CRUD | ❌ Pendiente | No existe `user-form` |

---

## 2. Alcance Funcional

1. **Listar** usuarios con botón "Nuevo Usuario" y acciones Edit/Delete por fila
2. **Crear** usuario: alias, displayName, email, password, roleId, applicationId, notificaciones, privacidad
3. **Editar** usuario: campos básicos + persona (nombre, apellido, género, nacimiento) + gestión de roles
4. **Eliminar** usuario con confirmación obligatoria (acción destructiva irreversible)
5. **Gestión de roles**: link/unlink de roles desde el formulario de edición

---

## 3. Modelos de Datos

Los modelos existentes son suficientes. Referencia:

```typescript
// Crear usuario — src/app/shared/models/user.model.ts
export interface UserCreateRequest {
  alias: string;           // requerido, único por aplicación
  displayName: string;     // requerido
  password: string;        // requerido
  email: string;           // requerido, único por aplicación
  person: Person;          // requerido (firstName, lastName mínimo)
  roleId: string;          // requerido — rol inicial del usuario
  applicationId: string;   // requerido
}

// Actualización parcial
export interface PutUserUpdateRequest {
  application: Application;   // requerido en updates
  password?: string;
  displayName?: string;
  active?: boolean;
  notificationEmail?: boolean;
  notificationSms?: boolean;
  privacyDataOutActive?: boolean;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender?: string;
  birthdate?: string;
  contacts?: PutUserUpdateContact[];
  roleIds?: string[];
}
```

---

## 4. Tareas de Implementación

### 4.1 Capa BFF (`server/`)

Sin cambios — `server/routes/users.routes.js` ya tiene todos los endpoints necesarios.

### 4.2 Capa de Servicio Angular

Sin cambios — `UserService` ya implementa todos los métodos.

### 4.3 Constantes API

Sin cambios — `API.USERS` ya tiene todos los path-builders.

### 4.4 Capa de Interfaz Angular

**Árbol de archivos a crear:**

```
src/app/features/users/
├── user-form/
│   └── user-form.component.ts    ← formulario create/edit con secciones
└── users.routes.ts               ← EXTENDER con rutas 'new' y ':userId/edit'
```

**Actualizar `users.routes.ts`:**
```typescript
export const usersRoutes: Routes = [
  { path: '', loadComponent: () => UsersListComponent },
  { path: 'new', loadComponent: () => UserFormComponent },        // ← AGREGAR
  { path: ':userId/edit', loadComponent: () => UserFormComponent }, // ← AGREGAR
];
```

---

## 5. Especificación de `UserFormComponent`

### Modo Creación (`/users/new`)

**Campos requeridos:**

| Campo | Tipo | Validaciones |
|---|---|---|
| `alias` | text | Requerido, validación async disponibilidad |
| `email` | email | Requerido, formato email, validación async disponibilidad |
| `password` | password | Requerido, mínimo 8 caracteres |
| `displayName` | text | Requerido |
| `roleId` | select | Requerido — cargado de `RoleService.getAll(true)` |
| `applicationId` | text (readonly) | Requerido — pre-cargado de `API.APPLICATION.ID` |
| `firstName` | text | Requerido (parte de `person`) |
| `lastName` | text | Requerido (parte de `person`) |

**Campos opcionales:**

| Campo | Tipo |
|---|---|
| `middleName` | text |
| `gender` | select (M/F/O) |
| `birthdate` | date |
| `notificationEmail` | toggle |
| `notificationSms` | toggle |
| `privacyDataOutActive` | toggle |

**Validaciones async (con debounce 400 ms):**
- `alias`: llama `userService.checkAlias(alias, applicationId)` — 200 = disponible, 404 = ya tomado
- `email`: llama `userService.checkEmail(email, applicationId)` — igual

**Submit modo create:**
1. `userService.create(UserCreateRequest)` → `UserCreateResponse`
2. Toast success con el ID creado
3. Navegar a `/users`

### Modo Edición (`/users/:userId/edit`)

**Al cargar:**
- `userService.getById(userId)` para pre-rellenar todos los campos
- `roleService.getAll(true)` para cargar el selector de roles disponibles

**Secciones del formulario:**

**Sección 1 — Datos Básicos** (campos no editables en gris, editables resaltados):
- `alias` (readonly — no editable después de creación)
- `displayName` (editable)
- `active` (toggle)
- `notificationEmail`, `notificationSms`, `privacyDataOutActive` (toggles)

**Sección 2 — Cambiar Contraseña** (colapsada por defecto):
- `password` (opcional en edit — solo enviar si el usuario lo rellena)

**Sección 3 — Datos de Persona:**
- `firstName`, `middleName`, `lastName`, `gender`, `birthdate`

**Sección 4 — Gestión de Roles:**
- Lista de roles disponibles como checkboxes
- Roles actuales del usuario pre-seleccionados
- Al desmarcar un rol → `userService.unlinkRole(userId, roleId)`
- Al marcar un rol → `userService.linkRole(userId, roleId)`
- Las operaciones link/unlink se ejecutan **individualmente por rol** al guardar

**Submit modo edit:**
1. `userService.update(userId, PutUserUpdateRequest)` para campos básicos/persona
2. Para cada cambio de rol: `linkRole()` o `unlinkRole()` según corresponda
3. Toast success
4. Navegar a `/users`

---

## 6. Especificación de Eliminación en `UsersListComponent`

**Actualizar `UsersListComponent`:**
- Agregar botón "Nuevo Usuario" (header)
- Columna "Acciones": botón "Editar" → `/users/:id/edit`, botón "Eliminar" (rojo)
- Eliminar: activa `ConfirmDialogComponent` con mensaje:
  ```
  ¿Eliminar al usuario "[alias]"? Esta acción no se puede deshacer y eliminará todos sus datos asociados.
  ```
- Al confirmar: `userService.delete(applicationId, userId)` → refrescar lista → toast success
- Al cancelar: no ocurre nada

---

## 7. Reutilización vs. Creación

| Archivo | Acción | Detalle |
|---|---|---|
| `server/routes/users.routes.js` | **REUTILIZAR** | Sin cambios |
| `src/app/core/services/user.service.ts` | **REUTILIZAR** | Sin cambios |
| `src/app/core/services/role.service.ts` | **REUTILIZAR** | `getAll()` para selector de roles |
| `src/app/shared/models/user.model.ts` | **REUTILIZAR** | Sin cambios |
| `src/app/shared/constants/api.constants.ts` | **REUTILIZAR** | Sin cambios |
| `src/app/features/users/users-list/` | **EXTENDER** | Botón "Nuevo" + columna Acciones |
| `src/app/features/users/user-form/` | **CREAR** | Componente nuevo con secciones |
| `src/app/features/users/users.routes.ts` | **EXTENDER** | Agregar rutas `new` y `edit` |
| `ConfirmDialogComponent` | **REUTILIZAR** | Confirmación antes de eliminar |
| `ToastService` | **REUTILIZAR** | Feedback de todas las operaciones |

---

## 8. Dependencias

- [01 · Componentes Compartidos](./01-componentes-compartidos.md) — `ConfirmDialogComponent` y `ToastService`
- [03 · Roles](./03-roles.md) — `RoleService.getAll()` para el selector de roles en el formulario

---

## 9. Criterios de Aceptación

- [ ] La lista muestra botón "Nuevo Usuario" y columna de acciones con Edit y Delete
- [ ] En creación, `alias` y `email` muestran feedback en tiempo real de disponibilidad
- [ ] El formulario de creación no envía si hay errores de validación
- [ ] Al crear, el usuario aparece en la lista y se muestra toast de éxito
- [ ] En edición, `alias` aparece en modo readonly
- [ ] Los roles actuales del usuario están pre-seleccionados en la sección de roles
- [ ] Marcar/desmarcar roles en edición actualiza las asignaciones al guardar
- [ ] El botón "Eliminar" muestra el diálogo de confirmación con el alias del usuario
- [ ] Confirmar eliminación remueve al usuario de la lista
- [ ] Los errores de API muestran toast de error con mensaje descriptivo
- [ ] El password en modo edición solo se envía si el usuario rellena el campo

---

## 10. Notas Técnicas

- La eliminación usa `userService.delete(applicationId, userId)` donde `applicationId` es `API.APPLICATION.ID` (constante fija).
- Las validaciones async de alias/email deben implementarse como `AsyncValidatorFn` de Angular Reactive Forms con `debounceTime(400)` y `distinctUntilChanged()` para evitar llamadas redundantes.
- En modo edición, las operaciones de link/unlink de roles no usan `update()` con `roleIds[]` — se usan los endpoints dedicados `PUT .../link/...` y `PUT .../unlink/...` para cambios individuales, lo que permite mejor feedback granular.
- El campo `applicationId` en los requests de update debe ser el objeto `Application` completo (campo requerido en `PutUserUpdateRequest`), no solo el ID.
