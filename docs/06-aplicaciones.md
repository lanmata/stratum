# Aplicaciones — Requisitos de Implementación

> Módulo nuevo con una restricción crítica de API: backbone-rest solo expone `POST /api/v1/applications`. No existe listado, consulta por ID, actualización ni eliminación. El módulo se implementa como **creación únicamente** hasta que la API sea extendida.

---

## 1. Estado Actual

| Elemento | Estado | Detalle |
|---|---|---|
| Rutas BFF | ❌ Pendiente | No existe `server/routes/applications.routes.js` |
| `ApplicationService` | ❌ Pendiente | No existe |
| Modelo `Application` | ⚠️ Incompleto | Existe en `application.model.ts` pero `ApplicationCreateRequest` no tiene el envelope completo |
| Constantes API | ❌ Pendiente | No hay entrada `APPLICATIONS` en `api.constants.ts` |
| Componente lista | ❌ Pendiente | No existe |
| Formulario crear | ❌ Pendiente | No existe |

---

## 2. Alcance Funcional

1. **Crear** aplicación: nombre, descripción, estado activo
2. **Listar** aplicaciones — vista placeholder con banner explicativo (sin datos — la API no tiene endpoint GET)

> Las operaciones de edición, eliminación y listado completo quedan como trabajo futuro condicionado a la extensión de la API backbone-rest.

---

## 3. Restricciones de API

> 🚫 **Restricción permanente de la API upstream**
>
> La API backbone-rest solo expone un endpoint para aplicaciones:
> ```
> POST /api/v1/applications   ← único endpoint disponible
> ```
>
> **No existen:**
> - `GET /api/v1/applications` — listado
> - `GET /api/v1/applications/{id}` — detalle
> - `PUT /api/v1/applications/{id}` — actualización
> - `DELETE /api/v1/applications/{id}` — eliminación
>
> **Impacto en Stratum:**
> - No se puede mostrar un listado de aplicaciones desde el backend
> - No se puede editar ni eliminar aplicaciones existentes
> - La vista de lista mostrará un mensaje informativo y solo el botón de creación
>
> **Estrategia:** La arquitectura permite agregar los métodos `getAll()`, `getById()`, `update()`, `delete()` al servicio en el futuro sin cambios estructurales cuando la API los exponga.

---

## 4. Modelos de Datos

**Corregir `src/app/shared/models/application.model.ts`:**

```typescript
export interface Application {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdDate?: string;
  lastUpdate?: string;
  serviceTypeId?: string;
  userList?: string[];
  roleList?: string[];
}

// CORRECCIÓN: agregar envelope completo (la API requiere esta estructura)
export interface ApplicationCreateRequest {
  application: {
    name: string;
    description?: string;
    active?: boolean;   // default: true
  };
  dateTime?: string;
  appName?: string;
  appToken?: string;
}

// Respuesta de creación
export type ApplicationCreateResponse = Application;
```

---

## 5. Tareas de Implementación

### 5.1 Capa BFF (`server/`)

**Archivo nuevo:** `server/routes/applications.routes.js`

| Verbo | Ruta Express | Path backbone-rest |
|---|---|---|
| `POST` | `/` | `/api/v1/applications` |

```javascript
const { proxyToBackbone } = require('../shared/proxy');
const router = require('express').Router();

router.post('/', (req, res) =>
  proxyToBackbone(req, res, '/api/v1/applications'));

module.exports = router;
```

**Montar en `server.js`:**
```javascript
const applicationsRoutes = require('./server/routes/applications.routes');
app.use('/api/v1/applications', applicationsRoutes);
```

### 5.2 Capa de Servicio Angular

**Archivo nuevo:** `src/app/core/services/application.service.ts`

| Método | Firma | Endpoint | Disponible |
|---|---|---|---|
| `create(req)` | `(req: ApplicationCreateRequest): Observable<Application>` | `POST APPLICATIONS.ROOT` | ✅ Ahora |
| `getAll()` | `(): Observable<Application[]>` | `GET APPLICATIONS.ROOT` | ⏳ Futuro |
| `getById(id)` | `(id: string): Observable<Application>` | `GET APPLICATIONS.BY_ID(id)` | ⏳ Futuro |
| `update(id, req)` | `(id: string, req): Observable<Application>` | `PUT APPLICATIONS.BY_ID(id)` | ⏳ Futuro |
| `delete(id)` | `(id: string): Observable<void>` | `DELETE APPLICATIONS.BY_ID(id)` | ⏳ Futuro |

Solo implementar `create()` ahora. Documentar los demás como stubs comentados para facilitar extensión futura.

### 5.3 Constantes API

**Extender `src/app/shared/constants/api.constants.ts`:**

```typescript
APPLICATIONS: {
  ROOT: '/v1/applications',
  // Futuros (agregar cuando la API los exponga):
  // BY_ID: (id: string) => `/v1/applications/${id}`,
},
```

### 5.4 Capa de Interfaz Angular

**Árbol de archivos a crear:**

```
src/app/features/applications/
├── applications-list/
│   └── applications-list.component.ts   ← vista placeholder + botón crear
├── application-form/
│   └── application-form.component.ts    ← formulario de creación
└── applications.routes.ts
```

**`applications.routes.ts`:**
```typescript
export const applicationsRoutes: Routes = [
  { path: '', loadComponent: () => ApplicationsListComponent },
  { path: 'new', loadComponent: () => ApplicationFormComponent },
];
```

**`ApplicationsListComponent` — comportamiento:**
- No realiza llamadas HTTP (no existe endpoint de listado)
- Muestra un banner informativo:
  ```
  ℹ️ La gestión completa de aplicaciones estará disponible cuando la API backbone-rest 
  exponga los endpoints de consulta y actualización.
  ```
- Botón "Nueva Aplicación" → `/applications/new`

**`ApplicationFormComponent` — comportamiento:**
- Solo modo creación (no hay modo edit por restricción de API)
- Campos: `name` (requerido, maxLength 128), `description` (opcional, maxLength 512), `active` (toggle, default: true)
- Submit: `applicationService.create()` → muestra el ID de la aplicación creada en un toast especial (el ID es importante para configurar otros módulos)
- Toast: `✅ Aplicación creada. ID: [id]` (con botón Copiar)
- Navegar a `/applications`

---

## 6. Reutilización vs. Creación

| Archivo | Acción | Detalle |
|---|---|---|
| `server/routes/applications.routes.js` | **CREAR** | Solo POST |
| `server.js` | **EXTENDER** | Agregar `app.use('/api/v1/applications', ...)` |
| `src/app/core/services/application.service.ts` | **CREAR** | Solo `create()` implementado |
| `src/app/shared/models/application.model.ts` | **EXTENDER** | Corregir envelope de `ApplicationCreateRequest` |
| `src/app/shared/constants/api.constants.ts` | **EXTENDER** | Agregar grupo `APPLICATIONS` |
| `src/app/features/applications/` | **CREAR** | Módulo nuevo completo |
| `src/app/app.routes.ts` | **EXTENDER** | Agregar ruta lazy `/applications` |
| `ToastService` | **REUTILIZAR** | Mostrar ID de aplicación creada |

---

## 7. Dependencias

- [01 · Componentes Compartidos](./01-componentes-compartidos.md) — `ToastService` para mostrar el ID post-creación

---

## 8. Criterios de Aceptación

- [ ] La vista de lista muestra el banner informativo sobre la limitación de la API
- [ ] El botón "Nueva Aplicación" navega al formulario de creación
- [ ] El formulario valida que `name` no esté vacío
- [ ] Al crear con éxito, el toast muestra el ID de la aplicación creada
- [ ] El formulario no ofrece opción de editar ni eliminar
- [ ] Los errores de API muestran toast de error

---

## 9. Notas Técnicas

- El ID de la aplicación creada es crítico para la operación del sistema (es el `applicationId` que usan los usuarios, la sesión, etc.). El toast debe hacer visible este ID de forma prominente y permitir copiarlo al portapapeles.
- El `ApplicationCreateRequest` actual en el código puede diferir del correcto — verificar contra la API antes de implementar.
- Los stubs de métodos futuros (`getAll`, `getById`, etc.) deben documentarse como `TODO` con la URL del endpoint correspondiente, para que la implementación futura sea trivial.
