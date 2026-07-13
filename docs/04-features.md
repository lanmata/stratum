# Features — Requisitos de Implementación

> Mismo patrón que Roles: servicio y BFF ya completos, solo falta la UI. Existe un bug menor en `FeatureService.create()` que debe corregirse junto con la implementación de los formularios.

---

## 1. Estado Actual

| Elemento | Estado | Detalle |
|---|---|---|
| Rutas BFF | ✅ Completo | `server/routes/features.routes.js` tiene POST y PUT |
| `FeatureService` | ⚠️ Parcial | `create()` usa path hardcodeado `/v1/features/` en lugar de constante |
| Modelo `Feature` / `FeatureRequest` | ✅ Completo | En `src/app/shared/models/feature.model.ts` |
| Constantes API | ⚠️ Parcial | `FEATURES` existe pero no tiene `ROOT` para el POST |
| Componente lista | ✅ Completo | `FeaturesListComponent` — sin acciones ni botón "Nuevo" |
| Formularios CRUD | ❌ Pendiente | No existe `feature-form` |

---

## 2. Alcance Funcional

1. **Listar** features con acciones de edición por fila (la lista ya existe, requiere actualización)
2. **Crear** feature con nombre, descripción y estado activo
3. **Editar** feature existente
4. ~~**Eliminar** feature~~ — **No disponible**: la API backbone-rest no expone `DELETE /api/v1/features/{featureId}`.

---

## 3. Restricciones de API

> ⚠️ **La API backbone-rest no expone un endpoint de eliminación para features.**
>
> `DELETE /api/v1/features/{featureId}` no existe en la especificación. Stratum no incluirá funcionalidad de eliminación de features.

---

## 4. Modelos de Datos

Los modelos existentes son suficientes:

```typescript
// Existente en src/app/shared/models/feature.model.ts
export interface Feature {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface FeatureRequest {
  feature: Feature;
  dateTime?: string;
  appName?: string;
  appToken?: string;
}
```

---

## 5. Tareas de Implementación

### 5.1 Capa BFF (`server/`)

Sin cambios — `server/routes/features.routes.js` ya tiene `POST /` y `PUT /:featureId`.

### 5.2 Capa de Servicio Angular

**Corregir bug en `src/app/core/services/feature.service.ts`:**

El método `create()` actualmente usa un path hardcodeado. Debe usar la constante `API.FEATURES.ROOT`:

```typescript
// ANTES (bug)
create(req: FeatureRequest): Observable<Feature> {
  return this.http.post<Feature>('/v1/features/', req);
}

// DESPUÉS (correcto)
create(req: FeatureRequest): Observable<Feature> {
  return this.http.post<Feature>(API.FEATURES.ROOT, req);
}
```

### 5.3 Constantes API

**Extender `src/app/shared/constants/api.constants.ts`:**

```typescript
FEATURES: {
  ROOT: '/v1/features',            // ← AGREGAR (corrige el bug en feature.service.ts)
  WITH_INACTIVE: (include: boolean) => `/v1/features/${include}`,  // ya existe
  BY_ID: (id: string) => `/v1/features/find/${id}`,               // ya existe
  UPDATE: (id: string) => `/v1/features/${id}`,   // ← AGREGAR
},
```

### 5.4 Capa de Interfaz Angular

**Árbol de archivos a crear:**

```
src/app/features/features-mgmt/
├── feature-form/
│   └── feature-form.component.ts    ← formulario create/edit
└── features-mgmt.routes.ts          ← EXTENDER con rutas 'new' y ':featureId/edit'
```

**Actualizar `features-mgmt.routes.ts`:**
```typescript
export const featuresMgmtRoutes: Routes = [
  { path: '', loadComponent: () => FeaturesListComponent },              // ya existe
  { path: 'new', loadComponent: () => FeatureFormComponent },            // ← AGREGAR
  { path: ':featureId/edit', loadComponent: () => FeatureFormComponent }, // ← AGREGAR
];
```

**Actualizar `FeaturesListComponent`:**
- Agregar botón "Nueva Feature" → routerLink `/features-mgmt/new`
- Agregar columna "Acciones" con link "Editar" → `/features-mgmt/:id/edit`
- No incluir botón "Eliminar"

**`FeatureFormComponent` — comportamiento:**
- Detecta modo por `ActivatedRoute.snapshot.paramMap.get('featureId')`
- En modo `edit`: llama `featureService.getById(featureId)` y pre-rellena el formulario
- Campos: `name` (requerido, maxLength 128), `description` (opcional, maxLength 512), `active` (toggle)
- Submit: llama `featureService.create()` o `update()` → toast → navega a `/features-mgmt`
- Botón Cancelar → navega a `/features-mgmt`

---

## 6. Reutilización vs. Creación

| Archivo | Acción | Detalle |
|---|---|---|
| `server/routes/features.routes.js` | **REUTILIZAR** | Sin cambios |
| `src/app/core/services/feature.service.ts` | **EXTENDER** | Corregir path hardcodeado en `create()` |
| `src/app/shared/models/feature.model.ts` | **REUTILIZAR** | Sin cambios |
| `src/app/shared/constants/api.constants.ts` | **EXTENDER** | Agregar `FEATURES.ROOT` y `FEATURES.UPDATE` |
| `src/app/features/features-mgmt/features-list/` | **EXTENDER** | Botón "Nueva" + columna Acciones |
| `src/app/features/features-mgmt/feature-form/` | **CREAR** | Componente nuevo |
| `src/app/features/features-mgmt/features-mgmt.routes.ts` | **EXTENDER** | Agregar rutas `new` y `edit` |
| `ToastService` | **REUTILIZAR** | Feedback en save |

---

## 7. Dependencias

- [01 · Componentes Compartidos](./01-componentes-compartidos.md) — `ToastService` para feedback al guardar

---

## 8. Criterios de Aceptación

- [ ] La lista de features muestra el botón "Nueva Feature" en el encabezado
- [ ] La lista tiene columna "Acciones" con link "Editar" por cada feature
- [ ] No hay botón "Eliminar" en la lista ni en el formulario
- [ ] El formulario de creación valida que `name` no esté vacío
- [ ] Al crear con éxito aparece toast de éxito y redirige a `/features-mgmt`
- [ ] El formulario de edición carga los datos actuales de la feature
- [ ] Al editar con éxito aparece toast de éxito y redirige a `/features-mgmt`
- [ ] `FeatureService.create()` usa `API.FEATURES.ROOT` (bug corregido)
- [ ] Los errores de API muestran toast de error

---

## 9. Notas Técnicas

- El bug en `feature.service.ts` es el único cambio en archivos existentes de la capa de servicio — asegurarse de que la corrección también actualice el test unitario si existe.
- `FeatureRequest` usa el mismo patrón envelope que `RoleRequest` — el objeto `feature` incluye el `id` en modo edit.
- Los formularios de roles y features son prácticamente idénticos en estructura. Si en el futuro se detecta triplicación, considerar un componente de formulario genérico (pero no implementarlo de forma prematura ahora).
