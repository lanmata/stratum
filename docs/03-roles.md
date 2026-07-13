# Roles — Requisitos de Implementación

> El servicio y el BFF ya están completos. Solo falta la capa de interfaz: formularios de creación y edición. La API no expone DELETE para roles — esta limitación es permanente y debe comunicarse al usuario.

---

## 1. Estado Actual

| Elemento | Estado | Detalle |
|---|---|---|
| Rutas BFF | ✅ Completo | `server/routes/roles.routes.js` tiene POST y PUT |
| `RoleService` | ✅ Completo | `create()` y `update()` ya implementados |
| Modelo `Role` / `RoleRequest` | ✅ Completo | En `src/app/shared/models/role.model.ts` |
| Constantes API | ⚠️ Parcial | `ROLES` existe pero falta `UPDATE: (id) => \`/v1/roles/${id}\`` como constante explícita |
| Componente lista | ✅ Completo | `RolesListComponent` — sin acciones ni botón "Nuevo" |
| Formularios CRUD | ❌ Pendiente | No existe `role-form` |

---

## 2. Alcance Funcional

1. **Listar** roles con acciones de edición por fila (la lista ya existe, requiere actualización)
2. **Crear** rol con nombre, descripción y estado activo
3. **Editar** rol existente
4. ~~**Eliminar** rol~~ — **No disponible**: la API backbone-rest no expone `DELETE /api/v1/roles/{roleId}`. La lista no incluirá botón de eliminar. Se mostrará un tooltip informativo si el usuario lo pregunta.

---

## 3. Restricciones de API

> ⚠️ **La API backbone-rest no expone un endpoint de eliminación para roles.**
>
> `DELETE /api/v1/roles/{roleId}` no existe en la especificación. Como consecuencia, Stratum no incluirá funcionalidad de eliminación de roles. Si en el futuro la API expone este endpoint, el BFF y el servicio pueden extenderse sin cambios arquitecturales.

---

## 4. Modelos de Datos

Los modelos existentes son suficientes. No se requieren cambios:

```typescript
// Existente en src/app/shared/models/role.model.ts
export interface Role {
  id: string;
  name: string;
  description?: string;
  features: Feature[];
  active: boolean;
}

export interface RoleRequest {
  role: Role;
  dateTime?: string;
  appName?: string;
  appToken?: string;
}
```

---

## 5. Tareas de Implementación

### 5.1 Capa BFF (`server/`)

Sin cambios — `server/routes/roles.routes.js` ya tiene `POST /` y `PUT /:roleId`.

### 5.2 Capa de Servicio Angular

Sin cambios — `RoleService.create()` y `update()` ya están implementados.

### 5.3 Constantes API

**Extender `src/app/shared/constants/api.constants.ts`** — mover el path de update a constante:

```typescript
ROLES: {
  ROOT: '/v1/roles',               // ya existe
  WITH_INACTIVE: (include: boolean) => `/v1/roles/${include}`,  // ya existe
  BY_ID: (id: string) => `/v1/roles/find/${id}`,               // ya existe
  BY_USER: (userId: string) => `/v1/roles/user/${userId}`,      // ya existe
  UPDATE: (id: string) => `/v1/roles/${id}`,   // ← AGREGAR
},
```

### 5.4 Capa de Interfaz Angular

**Árbol de archivos a crear:**

```
src/app/features/roles/
├── role-form/
│   └── role-form.component.ts    ← formulario create/edit
└── roles.routes.ts               ← EXTENDER con rutas 'new' y ':roleId/edit'
```

**Actualizar `roles.routes.ts`:**
```typescript
export const rolesRoutes: Routes = [
  { path: '', loadComponent: () => RolesListComponent },          // ya existe
  { path: 'new', loadComponent: () => RoleFormComponent },        // ← AGREGAR
  { path: ':roleId/edit', loadComponent: () => RoleFormComponent }, // ← AGREGAR
];
```

**Actualizar `RolesListComponent`:**
- Agregar botón "Nuevo Rol" (header de la vista) → routerLink `/roles/new`
- Agregar columna "Acciones" con link "Editar" → `/roles/:id/edit`
- No incluir botón "Eliminar" — la API no lo soporta

**`RoleFormComponent` — comportamiento:**
- Detecta modo por `ActivatedRoute.snapshot.paramMap.get('roleId')`
- En modo `edit`: llama `roleService.getById(roleId)` y pre-rellena el formulario
- Campos: `name` (requerido, maxLength 128), `description` (opcional, maxLength 512), `active` (toggle)
- Submit: llama `roleService.create()` o `update()` → toast → navega a `/roles`
- Botón Cancelar → navega a `/roles`

---

## 6. Reutilización vs. Creación

| Archivo | Acción | Detalle |
|---|---|---|
| `server/routes/roles.routes.js` | **REUTILIZAR** | Sin cambios |
| `src/app/core/services/role.service.ts` | **REUTILIZAR** | Sin cambios |
| `src/app/shared/models/role.model.ts` | **REUTILIZAR** | Sin cambios |
| `src/app/shared/constants/api.constants.ts` | **EXTENDER** | Agregar `ROLES.UPDATE` |
| `src/app/features/roles/roles-list/` | **EXTENDER** | Botón "Nuevo" + columna Acciones |
| `src/app/features/roles/role-form/` | **CREAR** | Componente nuevo |
| `src/app/features/roles/roles.routes.ts` | **EXTENDER** | Agregar rutas `new` y `edit` |
| `ToastService` | **REUTILIZAR** | Feedback en save |

---

## 7. Dependencias

- [01 · Componentes Compartidos](./01-componentes-compartidos.md) — `ToastService` para feedback al guardar

---

## 8. Criterios de Aceptación

- [ ] La lista de roles muestra el botón "Nuevo Rol" en el encabezado
- [ ] La lista tiene columna "Acciones" con link "Editar" por cada rol
- [ ] No hay botón "Eliminar" en la lista ni en el formulario
- [ ] El formulario de creación valida que `name` no esté vacío
- [ ] Al crear con éxito aparece toast de éxito y redirige a `/roles`
- [ ] El formulario de edición carga los datos actuales del rol
- [ ] Al editar con éxito aparece toast de éxito y redirige a `/roles`
- [ ] Los errores de API muestran toast de error
- [ ] El botón Cancelar navega a `/roles` sin guardar cambios

---

## 9. Notas Técnicas

- `RoleFormComponent` usa el mismo modo de detección que los demás formularios: `paramMap.get('roleId') !== null` → modo edit.
- `RoleRequest` envuelve el objeto `Role`. Al hacer `update()`, el objeto role debe incluir el `id` existente además de los campos editados.
- El formulario usa `FormBuilder.nonNullable.group` siguiendo el patrón del `LoginComponent`.
- El campo `features[]` del rol **no se edita en este formulario** — la asignación de features a roles es una operación separada que actualmente no tiene endpoint dedicado en la API (los features se asignan a través del rol al crearlo/actualizarlo incluyendo el array).
