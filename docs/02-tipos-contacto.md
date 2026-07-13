# Tipos de Contacto — Requisitos de Implementación

> Módulo completamente nuevo para gestionar el catálogo de tipos de contacto (email, teléfono, dirección, etc.) que usa el sistema. Es el módulo CRUD de referencia más simple — sirve como patrón para los demás.

---

## 1. Estado Actual

| Elemento | Estado | Detalle |
|---|---|---|
| Rutas BFF | ❌ Pendiente | No existe `server/routes/contact-types.routes.js` |
| `ContactTypeService` | ❌ Pendiente | No existe |
| Modelo `ContactType` | ⚠️ Incompleto | Existe en `contact.model.ts` pero falta `description`; `ContactTypeRequest` no existe |
| Constantes API | ❌ Pendiente | No hay entrada `CONTACT_TYPES` en `api.constants.ts` |
| Componente lista | ❌ Pendiente | No existe |
| Formularios CRUD | ❌ Pendiente | No existen |

---

## 2. Alcance Funcional

1. **Listar** todos los tipos de contacto (GET `/list-all`)
2. **Crear** tipo de contacto con nombre, descripción y estado activo
3. **Editar** tipo de contacto existente
4. **Eliminar** tipo de contacto con confirmación obligatoria

---

## 3. Modelos de Datos

**Extender `src/app/shared/models/contact.model.ts`:**

```typescript
// Agregar description a la interfaz existente
export interface ContactType {
  id: string;
  name: string;
  description?: string;   // ← campo faltante
  active: boolean;
}

// Agregar interfaz nueva — envelope requerido por la API
export interface ContactTypeRequest {
  contactType: ContactType;
  dateTime?: string;
  appName?: string;
  appToken?: string;
}
```

---

## 4. Tareas de Implementación

### 4.1 Capa BFF (`server/`)

**Archivo nuevo:** `server/routes/contact-types.routes.js`

| Verbo | Ruta Express | Path backbone-rest |
|---|---|---|
| `POST` | `/` | `/api/v1/contact-types/` |
| `GET` | `/list-all` | `/api/v1/contact-types/list-all` |
| `GET` | `/:contactTypeId` | `/api/v1/contact-types/:contactTypeId` |
| `PUT` | `/:contactTypeId` | `/api/v1/contact-types/:contactTypeId` |
| `DELETE` | `/:contactTypeId` | `/api/v1/contact-types/:contactTypeId` |

**Patrón de implementación** (igual a todos los routes del proyecto):
```javascript
const { proxyToBackbone } = require('../shared/proxy');
const router = require('express').Router();

router.get('/list-all', (req, res) =>
  proxyToBackbone(req, res, '/api/v1/contact-types/list-all'));
// ... resto de rutas
module.exports = router;
```

**Montar en `server.js`:**
```javascript
const contactTypesRoutes = require('./server/routes/contact-types.routes');
app.use('/api/v1/contact-types', contactTypesRoutes);
```

### 4.2 Capa de Servicio Angular

**Archivo nuevo:** `src/app/core/services/contact-type.service.ts`

| Método | Firma | Endpoint |
|---|---|---|
| `getAll()` | `(): Observable<ContactType[]>` | `GET CONTACT_TYPES.LIST_ALL` |
| `getById(id)` | `(id: string): Observable<ContactType>` | `GET CONTACT_TYPES.BY_ID(id)` |
| `create(req)` | `(req: ContactTypeRequest): Observable<ContactType>` | `POST CONTACT_TYPES.ROOT` |
| `update(id, req)` | `(id: string, req: ContactTypeRequest): Observable<ContactType>` | `PUT CONTACT_TYPES.BY_ID(id)` |
| `delete(id)` | `(id: string): Observable<ContactType>` | `DELETE CONTACT_TYPES.BY_ID(id)` |

### 4.3 Constantes API

**Extender `src/app/shared/constants/api.constants.ts`:**

```typescript
CONTACT_TYPES: {
  ROOT: '/v1/contact-types',
  LIST_ALL: '/v1/contact-types/list-all',
  BY_ID: (id: string) => `/v1/contact-types/${id}`,
},
```

### 4.4 Capa de Interfaz Angular

**Árbol de archivos a crear:**

```
src/app/features/contact-types/
├── contact-types-list/
│   └── contact-types-list.component.ts   ← tabla + botón "Nuevo" + acciones Edit/Delete
├── contact-type-form/
│   └── contact-type-form.component.ts    ← formulario create/edit (detecta modo por ruta)
└── contact-types.routes.ts               ← rutas del módulo
```

**`contact-types.routes.ts`:**
```typescript
export const contactTypesRoutes: Routes = [
  { path: '', loadComponent: () => ContactTypesListComponent },
  { path: 'new', loadComponent: () => ContactTypeFormComponent },
  { path: ':contactTypeId/edit', loadComponent: () => ContactTypeFormComponent },
];
```

**`ContactTypesListComponent` — comportamiento:**
- Señal `contactTypes = signal<ContactType[]>([])` cargada en `ngOnInit`
- Columnas: Nombre, Descripción, Activo (badge), Acciones (Editar, Eliminar)
- Botón "Nuevo Tipo de Contacto" → `/contact-types/new`
- Eliminar: activa `ConfirmDialogComponent` → llama `contactTypeService.delete()` → toast success/error

**`ContactTypeFormComponent` — comportamiento:**
- Detecta modo `create` vs `edit` con `ActivatedRoute.snapshot.paramMap.get('contactTypeId')`
- En modo `edit`: carga el tipo por ID con `getById()` y pre-rellena el formulario
- Campos: `name` (requerido, maxLength 128), `description` (opcional, maxLength 512), `active` (toggle, default: true)
- Submit: llama `create()` o `update()` según el modo → toast → navega a `/contact-types`
- Botón Cancelar → navega a `/contact-types`

---

## 5. Reutilización vs. Creación

| Archivo | Acción | Detalle |
|---|---|---|
| `server/routes/contact-types.routes.js` | **CREAR** | Nuevo router BFF |
| `server.js` | **EXTENDER** | Agregar `app.use('/api/v1/contact-types', ...)` |
| `src/app/core/services/contact-type.service.ts` | **CREAR** | Nuevo servicio |
| `src/app/shared/models/contact.model.ts` | **EXTENDER** | Agregar `description` y `ContactTypeRequest` |
| `src/app/shared/constants/api.constants.ts` | **EXTENDER** | Agregar grupo `CONTACT_TYPES` |
| `src/app/features/contact-types/` | **CREAR** | Módulo nuevo completo |
| `src/app/app.routes.ts` | **EXTENDER** | Agregar ruta lazy `/contact-types` |
| `HttpService` | **REUTILIZAR** | Sin cambios |
| `ConfirmDialogComponent` | **REUTILIZAR** | Para acción de eliminación |
| `ToastService` | **REUTILIZAR** | Para feedback de operaciones |

---

## 6. Dependencias

- [01 · Componentes Compartidos](./01-componentes-compartidos.md) — `ConfirmDialogComponent` para eliminar, `ToastService` para feedback

---

## 7. Criterios de Aceptación

- [ ] La lista muestra todos los tipos de contacto con nombre, descripción, estado y acciones
- [ ] El botón "Nuevo Tipo de Contacto" navega al formulario de creación
- [ ] El formulario de creación valida que `name` no esté vacío antes de enviar
- [ ] Al crear con éxito aparece un toast de éxito y se redirige a la lista
- [ ] El botón "Editar" carga el formulario pre-relleno con los datos actuales
- [ ] Al editar con éxito aparece un toast de éxito y se redirige a la lista
- [ ] El botón "Eliminar" muestra el `ConfirmDialogComponent` antes de proceder
- [ ] Al confirmar la eliminación, el registro desaparece de la lista y aparece un toast
- [ ] Al cancelar la eliminación, nada cambia
- [ ] Los errores de API muestran un toast de error con mensaje descriptivo
- [ ] El indicador de carga (`LoadingService`) se activa durante las llamadas HTTP

---

## 8. Notas Técnicas

- `ContactTypeRequest` usa el mismo patrón de envelope que `RoleRequest` y `FeatureRequest`: `{ contactType: ContactType; dateTime?, appName?, appToken? }`. Los campos de envelope son opcionales en la llamada desde el frontend — la API los acepta sin ellos.
- La respuesta de `DELETE /:contactTypeId` devuelve el `ContactType` eliminado (no 204) — la firma del servicio retorna `Observable<ContactType>`.
- El formulario usa `FormBuilder.nonNullable.group` siguiendo el patrón del `LoginComponent` existente.
