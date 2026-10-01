# Stratum — YouTrack Issues

> Historial de tickets del backoffice de Stratum. Actualizado para reflejar el estado real de implementación — ver [00-indice.md](./00-indice.md) para el panorama completo y los documentos individuales (01-08) para el detalle corregido de cada módulo.

---

## STR-01 — Componentes Compartidos (ConfirmDialog + Toast)

**Status:** ✅ Done

Implementado tal como se especificó: `ConfirmDialogComponent` (modal inline controlado por signal local, sin CDK) y `ToastService`/`ToastComponent` (señales, auto-dismiss configurable). Ver [01-componentes-compartidos.md](./01-componentes-compartidos.md).

---

## STR-02 — Tipos de Contacto: CRUD completo

**Status:** ✅ Done

Implementado tal como se especificó. Sirvió de patrón de referencia para Tipos de Aviso (STR-11) y para los gestores de Contactos/Direcciones/Documentos scoped a persona (STR-09b). Ver [02-tipos-contacto.md](./02-tipos-contacto.md).

---

## STR-03 — Roles: formularios Crear/Editar

**Status:** ✅ Done — con un cambio de diseño

Implementado, pero bajo `/applications/:applicationId/roles` (no `/roles` top-level), y con las features del rol editables **inline en el mismo formulario** en vez de una pantalla de asignación separada. Ver [03-roles.md](./03-roles.md).

---

## STR-04 — Features: formularios Crear/Editar + corrección de bug

**Status:** ✅ Done — fusionado en STR-03

No se construyó como módulo independiente (`/features-mgmt`). La gestión de features se absorbió en el formulario de Roles (STR-03) porque las features siempre se consumen en el contexto de un rol. El bug de `FeatureService.create()` usando un path hardcodeado se corrigió de todas formas. Ver [04-features.md](./04-features.md).

---

## STR-05 — Usuarios: CRUD completo + gestión de roles

**Status:** ✅ Done — con correcciones

Implementado bajo `/applications/:applicationId/users`. Dos correcciones sobre el plan original: `PutUserUpdateRequest.application` es un string UUID (no el objeto `Application` completo), y la sección "Contactos" del formulario de edición pasó de ser de solo lectura a tener CRUD completo (STR-09b). Ver [05-usuarios.md](./05-usuarios.md).

---

## STR-06 — Aplicaciones: módulo de creación (restricción de API)

**Status:** ✅ Done — superado por la realidad de la API

La premisa de este ticket ("la API solo permite POST") quedó obsoleta: el backend real expone CRUD completo de aplicaciones. Se implementó lista, detalle (hub de pestañas), crear y editar; la acción destructiva de la lista es "desactivar" (decisión de producto, no limitación de API). Ver [06-aplicaciones.md](./06-aplicaciones.md).

---

## STR-07 — Clientes Gestionados (M2M OAuth2): módulo completo

**Status:** ✅ Done — con un cambio de ubicación

Implementado tal como se especificó (BFF, servicio, modelos, UI con diálogo de secreto de un solo uso), pero como pestaña "Clientes M2M" de `/applications/:applicationId/managed-clients`, no como módulo top-level. Ver [07-clientes-gestionados.md](./07-clientes-gestionados.md).

---

## STR-08 — Dashboard: agregar navegación para módulos nuevos

**Status:** ✅ Done — con una estructura distinta

El dashboard real no tiene tarjetas separadas para Usuarios/Roles/Clientes M2M (viven dentro de "Aplicaciones"). Sí tiene tarjetas para Aplicaciones, Personas, Auditoría, Tipos de Contacto, Tipos de Servicio y Tipos de Aviso. Ver [08-dashboard.md](./08-dashboard.md).

---

## STR-09 — Personas: CRUD completo

**Status:** ✅ Done

`PersonService` ya tenía `getAll/getById/create/update` correctos pero sin UI de creación/edición. Se agregó `person-form.component.ts` (patrón idéntico a Tipos de Contacto) y se extendió `people-list` con botón "Nueva Persona" y acción "Editar". No hay `DELETE` — la API no lo expone.

### STR-09b — Gestores de Contactos, Direcciones y Documentos de Identificación (scoped a persona)

**Status:** ✅ Done

Tres entidades reales de backbone-rest, cada una con su propio CRUD, todas scoped por `personId`:

| Entidad | Schema real | Nota |
|---|---|---|
| Contacto | `{ id, content, contactType, person, active }` | `ContactService` ya existía y era correcto; solo faltaba UI |
| Dirección | `{ id, personId, content, zipcode }` | El código especulativo anterior usaba el campo `address` en vez de `content` |
| Documento de identificación | `{ id, number, expirationDate, identificationType: 0\|1, personId }` | 0 = Pasaporte, 1 = Cédula. El código especulativo anterior tenía un schema completamente distinto (`{name, description, active}`), se reescribió desde cero |

Implementados como componentes compartidos (`src/app/shared/components/person-*`) porque se usan en dos lugares: la ficha de persona y el formulario de usuario (sección "Contactos", que antes era de solo lectura y ahora tiene CRUD completo).

---

## STR-10 — Sincronización de `api.yaml`

**Status:** ✅ Done

El `api.yaml` de Stratum estaba desactualizado respecto al backend real: le faltaban las 4 entidades de STR-09b/STR-11/STR-12, tenía un endpoint `/applications/by-ids` ya fusionado en `/applications?ids=`, y conservaba endpoints `/report/*` que el backend ya no expone. Se sincronizó copiando desde el repo hermano `backbone-rest` (`src/main/resources/static/api.yaml`).

---

## STR-11 — Tipos de Aviso: catálogo global

**Status:** ✅ Done

Clon del patrón de Tipos de Contacto (STR-02). El schema real (`{id, name, description, active, createdAt, updatedAt}`) coincidía con el código especulativo anterior, que se restauró casi sin cambios.

---

## STR-12 — Avisos: pestaña de Application Detail

**Status:** ✅ Done

`Notice` no tiene id propio — se identifica por la clave compuesta `(userId, applicationId, noticeTypeId)`. El código especulativo anterior asumía un id de superficie y endpoints `GET/PUT` por id que no existen en la API real; se reescribió el servicio y las rutas BFF contra el contrato real: `POST /notices`, `GET /notices/application/{applicationId}`, `DELETE /notices/user/{userId}/application/{applicationId}/notice-type/{noticeTypeId}`.

Implementado como pestaña "Avisos" en Application Detail: lista los acuses de recibo de esa aplicación (resolviendo `userId`/`noticeTypeId` a nombres legibles), con formulario de alta y revocación con confirmación.

---

## No implementado (fuera de alcance, deliberado)

- **`profile/image/*`** (logo por aplicación) — no pedido como parte de "conectividad y gestión de usuarios y aplicaciones".
- **`report/*`** — funcionalidad legacy, el backend ya no la expone más allá de lo documentado como tal.
- **`application-role-user`** y **`role-features`** como módulos independientes — nunca existieron en el backend real; el diseño correcto (roles con features embebidas, usuarios vinculados a roles vía `link`/`unlink`) ya está implementado (STR-03, STR-05).
