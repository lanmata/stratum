# Clientes Gestionados (M2M) — Requisitos de Implementación

> Módulo completamente nuevo para gestionar clientes OAuth2 machine-to-machine. Es el módulo de mayor esfuerzo: requiere BFF nuevo, servicio nuevo, modelos nuevos y UI compleja que incluye un diálogo especial para mostrar secretos que solo se devuelven una vez.

---

## 1. Estado Actual

| Elemento | Estado | Detalle |
|---|---|---|
| Rutas BFF | ❌ Pendiente | No existe `server/routes/managed-clients.routes.js` |
| `ManagedClientService` | ❌ Pendiente | No existe |
| Modelos | ❌ Pendiente | No existe `managed-client.model.ts` |
| Constantes API | ❌ Pendiente | No hay entrada `MANAGED_CLIENTS` |
| UI completa | ❌ Pendiente | No existe ningún componente |

---

## 2. Alcance Funcional

1. **Listar** clientes M2M con filtros (applicationId, active) y paginación (page/size)
2. **Crear** cliente: nombre, descripción, applicationId, scopes[], active
3. **Editar** cliente: nombre, descripción, scopes[], active
4. **Eliminar** cliente con confirmación obligatoria
5. **Rotar secreto** — genera nuevo `clientSecret` (plaintext, mostrar una sola vez)
6. **Revocar todos los tokens** activos del cliente con confirmación obligatoria

---

## 3. Modelos de Datos

**Crear `src/app/shared/models/managed-client.model.ts`:**

```typescript
export interface ManagedClientCreateRequest {
  name: string;           // requerido, max 128 caracteres
  description?: string;   // max 512 caracteres
  applicationId: string;  // uuid requerido
  scopes: string[];       // al menos 1 scope requerido
  active?: boolean;       // default: true
}

export interface ManagedClientCreateResponse {
  clientId: string;
  clientSecret: string;   // PLAINTEXT — devuelto una única vez, no vuelve a estar disponible
  name: string;
  applicationId: string;
  scopes: string[];
  active: boolean;
  createdAt: string;
}

export interface ManagedClientTO {
  clientId: string;
  name: string;
  description?: string;
  applicationId: string;
  scopes: string[];
  active: boolean;
  createdAt: string;
  lastUpdatedAt?: string;
  secretLastRotatedAt?: string;
}

export interface ManagedClientUpdateRequest {
  name?: string;          // todos los campos opcionales en update
  description?: string;
  scopes?: string[];
  active?: boolean;
}

export interface ManagedClientSecretRotateResponse {
  clientId: string;
  clientSecret: string;   // PLAINTEXT — devuelto una única vez
  gracePeriodSeconds: number;
  rotatedAt: string;
}

export interface ManagedClientListParams {
  applicationId?: string;
  active?: boolean;
  page?: number;          // default: 0
  size?: number;          // default: 20
}
```

---

## 4. Tareas de Implementación

### 4.1 Capa BFF (`server/`)

**Archivo nuevo:** `server/routes/managed-clients.routes.js`

| Verbo | Ruta Express | Path backbone-rest | Notas |
|---|---|---|---|
| `POST` | `/` | `/api/v1/managed-clients` | Crear cliente |
| `GET` | `/` | `/api/v1/managed-clients` | Listar — pasar `req.query` |
| `GET` | `/:clientId` | `/api/v1/managed-clients/:clientId` | Detalle |
| `PUT` | `/:clientId` | `/api/v1/managed-clients/:clientId` | Actualizar |
| `DELETE` | `/:clientId` | `/api/v1/managed-clients/:clientId` | Eliminar |
| `POST` | `/:clientId/rotate-secret` | `/api/v1/managed-clients/:clientId/rotate-secret` | Rotar secreto |
| `DELETE` | `/:clientId/tokens` | `/api/v1/managed-clients/:clientId/tokens` | Revocar tokens |

> ⚠️ **Nota sobre query params:** El BFF debe reenviar `req.query` al endpoint de listado. Verificar que `proxyToBackbone` en `server/shared/proxy.js` incluya los query params en la URL upstream.

**Montar en `server.js`:**
```javascript
const managedClientsRoutes = require('./server/routes/managed-clients.routes');
app.use('/api/v1/managed-clients', managedClientsRoutes);
```

### 4.2 Capa de Servicio Angular

**Archivo nuevo:** `src/app/core/services/managed-client.service.ts`

| Método | Firma | Endpoint |
|---|---|---|
| `list(params?)` | `(params?: ManagedClientListParams): Observable<ManagedClientTO[]>` | `GET MANAGED_CLIENTS.ROOT` |
| `getById(id)` | `(id: string): Observable<ManagedClientTO>` | `GET MANAGED_CLIENTS.BY_ID(id)` |
| `create(req)` | `(req: ManagedClientCreateRequest): Observable<ManagedClientCreateResponse>` | `POST MANAGED_CLIENTS.ROOT` |
| `update(id, req)` | `(id: string, req: ManagedClientUpdateRequest): Observable<ManagedClientTO>` | `PUT MANAGED_CLIENTS.BY_ID(id)` |
| `delete(id)` | `(id: string): Observable<void>` | `DELETE MANAGED_CLIENTS.BY_ID(id)` |
| `rotateSecret(id)` | `(id: string): Observable<ManagedClientSecretRotateResponse>` | `POST MANAGED_CLIENTS.ROTATE_SECRET(id)` |
| `revokeAllTokens(id)` | `(id: string): Observable<void>` | `DELETE MANAGED_CLIENTS.REVOKE_TOKENS(id)` |

### 4.3 Constantes API

**Extender `src/app/shared/constants/api.constants.ts`:**

```typescript
MANAGED_CLIENTS: {
  ROOT: '/v1/managed-clients',
  BY_ID: (id: string) => `/v1/managed-clients/${id}`,
  ROTATE_SECRET: (id: string) => `/v1/managed-clients/${id}/rotate-secret`,
  REVOKE_TOKENS: (id: string) => `/v1/managed-clients/${id}/tokens`,
},
```

### 4.4 Capa de Interfaz Angular

**Árbol de archivos a crear:**

```
src/app/features/managed-clients/
├── managed-clients-list/
│   └── managed-clients-list.component.ts      ← tabla + filtros + paginación
├── managed-client-form/
│   └── managed-client-form.component.ts       ← formulario create/edit
├── managed-client-secret-dialog/
│   └── managed-client-secret-dialog.component.ts  ← modal para mostrar clientSecret
└── managed-clients.routes.ts
```

**`managed-clients.routes.ts`:**
```typescript
export const managedClientsRoutes: Routes = [
  { path: '', loadComponent: () => ManagedClientsListComponent },
  { path: 'new', loadComponent: () => ManagedClientFormComponent },
  { path: ':clientId/edit', loadComponent: () => ManagedClientFormComponent },
];
```

---

## 5. Especificación de Componentes

### `ManagedClientsListComponent`

**Filtros (signals locales):**
- `filterApplicationId = signal<string>('')`
- `filterActive = signal<boolean | null>(null)`
- `page = signal(0)`, `size = signal(20)`

**Columnas de tabla:**
- Nombre del cliente
- ApplicationId (truncado con tooltip completo)
- Scopes (chips/badges)
- Activo (badge verde/rojo)
- Última actualización
- Secreto rotado el (fecha)
- Acciones

**Acciones por fila:**

| Acción | Comportamiento |
|---|---|
| **Editar** | Navega a `/managed-clients/:clientId/edit` |
| **Rotar Secreto** | `ConfirmDialog` → `rotateSecret()` → `ManagedClientSecretDialog` |
| **Revocar Tokens** | `ConfirmDialog` especial → `revokeAllTokens()` → toast |
| **Eliminar** | `ConfirmDialog` → `delete()` → refrescar lista → toast |

### `ManagedClientFormComponent`

**Modo Creación:**

| Campo | Tipo | Validaciones |
|---|---|---|
| `name` | text | Requerido, maxLength 128 |
| `description` | textarea | Opcional, maxLength 512 |
| `applicationId` | text | Requerido, formato UUID |
| `scopes` | tags input | Requerido, al menos 1 scope |
| `active` | toggle | Default: true |

**Scopes** — implementar como input de chips: el usuario escribe un scope y presiona Enter/coma para agregarlo, puede eliminar chips con ✕.

**Al crear:** `managedClientService.create()` → la respuesta incluye `clientSecret` → mostrar `ManagedClientSecretDialogComponent` → al cerrar el diálogo, navegar a `/managed-clients`.

**Modo Edición:**
- `applicationId` en readonly (no se puede cambiar tras creación)
- `name`, `description`, `scopes`, `active` editables

### `ManagedClientSecretDialogComponent`

> ⚠️ **Componente crítico de seguridad.** El `clientSecret` se devuelve en texto plano una única vez. El usuario debe copiar y guardar el secreto antes de cerrar el diálogo.

**Comportamiento:**

| Elemento | Detalle |
|---|---|
| **Modal bloqueante** | No se puede cerrar sin confirmar — sin botón ✕, sin click fuera |
| **Campo secreto** | Texto monoespaciado con fondo oscuro, fácil de seleccionar |
| **Botón "Copiar"** | Copia al portapapeles con `navigator.clipboard.writeText()` |
| **Confirmación** | Checkbox "He guardado el secreto de forma segura" |
| **Botón cerrar** | Deshabilitado hasta marcar el checkbox |
| **Aviso** | Banner rojo: "Este secreto no volverá a mostrarse" |

**Inputs:**

```typescript
clientId = input.required<string>();
clientSecret = input.required<string>();
gracePeriodSeconds = input<number>();  // solo en rotación
rotatedAt = input<string>();           // solo en rotación
confirmed = output<void>();
```

---

## 6. Reutilización vs. Creación

| Archivo | Acción | Detalle |
|---|---|---|
| `server/routes/managed-clients.routes.js` | **CREAR** | Nuevo router BFF |
| `server.js` | **EXTENDER** | Agregar `app.use('/api/v1/managed-clients', ...)` |
| `src/app/core/services/managed-client.service.ts` | **CREAR** | Nuevo servicio |
| `src/app/shared/models/managed-client.model.ts` | **CREAR** | Modelos nuevos |
| `src/app/shared/constants/api.constants.ts` | **EXTENDER** | Agregar grupo `MANAGED_CLIENTS` |
| `src/app/features/managed-clients/` | **CREAR** | Módulo nuevo completo |
| `src/app/app.routes.ts` | **EXTENDER** | Agregar ruta lazy `/managed-clients` |
| `ConfirmDialogComponent` | **REUTILIZAR** | Para delete, rotate y revoke |
| `ToastService` | **REUTILIZAR** | Para todas las operaciones |

---

## 7. Dependencias

- [01 · Componentes Compartidos](./01-componentes-compartidos.md) — `ConfirmDialogComponent` y `ToastService` requeridos

---

## 8. Criterios de Aceptación

- [ ] La lista muestra clientes con filtros por applicationId y active funcionales
- [ ] La paginación funciona con page/size
- [ ] Al crear un cliente, aparece el diálogo de secreto con el `clientSecret` visible
- [ ] El diálogo de secreto no se puede cerrar sin marcar el checkbox de confirmación
- [ ] El botón "Copiar" copia el secreto al portapapeles
- [ ] Al rotar el secreto, aparece confirmación y luego el diálogo de secreto con el nuevo valor
- [ ] Al revocar tokens, aparece confirmación y toast de éxito tras completar
- [ ] Al eliminar un cliente, aparece confirmación y el cliente desaparece de la lista
- [ ] El formulario de edición no permite cambiar el `applicationId`
- [ ] Los errores de API muestran toast de error descriptivo
- [ ] El `clientSecret` **no se almacena** en el estado de la aplicación después de cerrar el diálogo

---

## 9. Notas Técnicas

- **Seguridad del secreto:** Tras mostrar el diálogo y cerrarlo, el `clientSecret` debe limpiarse del estado del componente inmediatamente. No debe persistirse en NgRx store, localStorage ni ningún estado compartido.
- **`navigator.clipboard`** requiere HTTPS o localhost. En producción esto estará disponible. En el BFF de desarrollo (puerto 4000 con HTTP) podría no funcionar — agregar un fallback de selección de texto manual.
- El campo `gracePeriodSeconds` en la rotación de secreto indica cuántos segundos el secreto anterior sigue siendo válido. Mostrar esta información en el diálogo de rotación para que el operador sepa cuándo el secreto viejo expira.
- Los scopes son strings arbitrarios definidos por la aplicación. No hay un enum predefinido en la API — el input de chips acepta cualquier valor.
- La autorización usa Bearer JWT (`Authorization` header) — esto ya está manejado por el interceptor de autenticación existente en Stratum. No requiere configuración adicional.
