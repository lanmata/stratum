# Contactos y Features segmentados — Guía técnica y de usuario

> ✅ **Implementado** en Stratum (`feat/scoped-contacts-features`) y backbone-rest / persistence / commons `0.0.4-SNAPSHOT`.
> Documentación del contrato de backbone: `backbone-rest/docs/api/contacts.md`, `backbone-rest/docs/api/features.md` y `api.yaml` (sincronizado en este repo).

---

## 1. Por qué (la decisión)

Backbone es una plataforma compartida: cada aplicación que la usa aporta usuarios, **contactos** y **roles con sus features**. Si una pantalla lista "todos los contactos" o "todas las features", crece con **todas las aplicaciones** y deja de ser usable (y de ser segura: muestra datos de otras aplicaciones).

Principios que se aplicaron:

1. **Un contacto pertenece a un titular dentro de una aplicación.** Nunca se lista un contacto fuera de ese contexto.
2. **Una feature se entiende por los roles que la usan.** El catálogo no se lista entero; se *busca* cuando hace falta (al crear un rol, o para saber a qué roles está vinculada).
3. **El servidor pagina y filtra.** El navegador nunca recibe (ni filtra) la colección completa.

| Antes | Ahora |
|---|---|
| Pantalla global `/contacts` con `GET /contacts/list-all` (en backbone ya devolvía `501`) | **Pestaña "Contactos" dentro de cada aplicación**, paginada y filtrada en el servidor |
| Un contacto solo podía ser de una persona | De una **persona** *o* de una **entidad externa** (p. ej. un comercio) dentro de una aplicación |
| Límite de contactos por persona en total | Límite y duplicados **por titular y por aplicación** |
| `/features` listaba todo el catálogo (`GET /features/{includeInactive}`) y además todos los roles | `/features` es una **búsqueda**: escribes, ves resultados paginados y "Ver roles" |
| En el formulario de rol no se podía reutilizar una feature existente | El formulario de rol **busca y vincula** features existentes (solo al crear) |

---

## 2. Modelo de datos

```
Contact ── pertenece a ──▶ UN titular:  Person (person_id)
   │                                    ó  Entidad externa (owner_type + owner_id)
   └──────── dentro de ──▶ Application (application_id)   ← obligatoria para entidades externas

Feature ◀── role_feature ──▶ Role ──▶ Application        (una aplicación tiene N roles; un rol tiene M features)
```

* `owner_type` (texto corto, p. ej. `MERCHANT`, guardado en mayúsculas) + `owner_id` (UUID en el espacio de nombres de la aplicación) identifican a un titular que **no es** persona ni aplicación. Backbone no necesita conocer esa entidad: la aplicación dueña es la que le da sentido al id.
* Restricciones de BD: `owner_type` y `owner_id` van juntos; un contacto tiene exactamente un titular (`num_nonnulls(person_id, owner_id) = 1`).

---

## 3. Guía técnica

### 3.1 Backbone (resumen del contrato)

| Endpoint | Uso |
|---|---|
| `GET /api/v1/contacts/?applicationId=…&contactTypeId=&active=&q=&page=&size=` | Directorio **de una aplicación**. `applicationId` obligatorio (`400` si falta). `size` máx. 100 (por defecto 20). Respuesta `{content, page, size, totalElements, totalPages}` |
| `GET /api/v1/contacts/person/{personId}?applicationId=` | Contactos de una persona (opcionalmente de una aplicación) |
| `GET /api/v1/contacts/owner/{ownerType}/{ownerId}?applicationId=` | Contactos de una entidad externa |
| `POST /api/v1/contacts/` | Crea un contacto. Cuerpo plano: `content`, `contentTypeId`, y `personId` **o** `ownerType`+`ownerId`(+`applicationId`) |
| `GET /api/v1/features/?q=&active=&page=&size=` | Búsqueda paginada del catálogo (resúmenes sin vínculos a roles). `size` máx. 50 |
| `GET /api/v1/features/{featureId}/roles?page=&size=` | Roles (y aplicación dueña) a los que está vinculada una feature |
| ~~`GET /contacts/list-all`~~, ~~`GET /contacts/list/{ids}`~~ | Eliminados |
| ~~`GET /features/{includeInactive}[/{ids}]`~~ | `deprecated` en backbone; Stratum **ya no los usa ni los expone** en el BFF |

### 3.2 BFF (`server/routes/`)

* `contacts.routes.js`: `GET /`, `POST /`, `GET /owner/:ownerType/:ownerId`, `GET /person/:personId`, `GET|PUT|DELETE /:contactId`. Se eliminaron `list-all` y `list/:ids`.
* `features.routes.js`: `GET /`, `GET /find/:id`, `GET /role/:roleId`, `GET /:featureId/roles`, `POST /`, `PUT /:id`. Se eliminaron los listados sin paginar.
* Los query params (`applicationId`, `q`, `page`, `size`…) se reenvían tal cual; el BFF no añade lógica (ver `proxy.js`).

### 3.3 Angular

| Pieza | Cambio |
|---|---|
| `ContactService` | `search(params)` (paginado, por aplicación), `getByPerson(personId, applicationId?)`, `getByOwner(type, id, applicationId?)`. Se eliminaron `getAll` / `getByIds`. `create/update` envían el cuerpo plano (`contentTypeId`, `applicationId`, `ownerType`, `ownerId`) |
| `FeatureService` | `search(params)`, `getRoles(featureId, page, size)`. Se eliminaron `getAll` / `getByStatusAndIds` |
| `Page<T>` (`shared/models/page.model.ts`) | Sobre de paginación común; `emptyPage()` |
| `ApplicationContactsComponent` | Pestaña "Contactos" de la aplicación: búsqueda con *debounce* (300 ms), filtros por tipo y estado, paginación de a 20 |
| `FeaturesListComponent` | `/features` como **búsqueda** (mín. 2 caracteres, *debounce* 300 ms) + panel "Roles que usan «X»" paginado |
| `RoleFormComponent` | Selector de features existentes (al crear): búsqueda paginada de a 5, "Vincular"; se envían con `id` (referencia a la feature existente) |
| `PersonContactsComponent` | Nuevo input `applicationId`: acota el listado y la creación. El formulario de **usuario** lo pasa, así que un usuario ve/crea solo los contactos de su aplicación |
| Navegación | Se quitó "Contactos" del menú y la ruta `/contacts` |

Reglas de UI para mantener la escala: las listas se paginan **en el servidor**, las búsquedas esperan 2 caracteres y usan *debounce*, y no hay `getAll` para catálogos que crecen con las aplicaciones.

### 3.4 Despliegue (orden importante)

1. **Base de datos** — `hibernate.ddl-auto` es `none`: aplicar primero `backbone-rest/docs/sql/V0.0.4__contact_owner_and_scoped_indexes.sql` (columnas `owner_type`/`owner_id`, restricciones e índices). Es idempotente.
2. **Librerías** — publicar `commons` y `persistence` `0.0.4` (hoy `0.0.4-SNAPSHOT` en las ramas `feat/scoped-contacts-features`) y fijar esa versión en `backbone-rest/pom.xml`.
3. **backbone-rest** — desplegar la nueva versión.
4. **Stratum** — `docker compose up -d --build` (ver [guía técnica Docker](./09-guia-tecnica-docker.md)). Desplegar Stratum **antes** que backbone dejaría las pantallas nuevas sin endpoints.

### 3.5 Pruebas

* **Frontend** (`pnpm run test:headless`): servicios (parámetros y cuerpo plano), `ApplicationContactsComponent`, `FeaturesListComponent`, selector de features en `RoleFormComponent`, `PersonContactsComponent` con `applicationId`, rutas y navegación.
* **BFF** (`pnpm run test:server`): rutas expuestas, reenvío de `applicationId`/filtros/paginación y que los listados sin paginar **ya no existen**.
* **Backbone** (`mvn test`): reglas de titular (persona XOR entidad), límite y duplicados por aplicación, directorio paginado (tope de tamaño, `applicationId` obligatorio) y un test de integración con Hibernate/H2 (`ScopedLookupIntegrationTest`) que ejecuta las consultas reales: aislamiento entre aplicaciones, filtros, paginación y escape de `%`/`_`.

---

## 4. Guía de usuario

### Ver los contactos de una aplicación

1. **Aplicaciones →** elige la aplicación → pestaña **Contactos**.
2. Verás los contactos **de esa aplicación**, de 20 en 20. Usa el cuadro de búsqueda (por contenido), el filtro de **tipo** y el de **estado**; los resultados se actualizan al dejar de escribir.
3. La columna **Titular** muestra la persona (enlace a su ficha) o, para entidades externas como un comercio, su tipo e identificador.
4. Para **crear o editar** un contacto de una persona, ve a su ficha (**Personas →** persona, o desde el usuario dentro de la aplicación). En la ficha de un **usuario** solo aparecen los contactos de **esa** aplicación; en la ficha global de la **persona** aparecen los de todas sus aplicaciones.

> Los contactos de entidades que no son personas (p. ej. un comercio) los registra la aplicación correspondiente a través de la API de backbone; aquí se consultan en la pestaña Contactos.

### Buscar una feature y saber dónde se usa

1. Menú **Features**. La página empieza vacía a propósito: el catálogo puede ser enorme.
2. Escribe al menos **2 caracteres** del nombre o la descripción. Filtra por **Activas / Inactivas** si hace falta.
3. En el resultado pulsa **Ver roles**: se listan los roles que usan esa feature y la **aplicación** de cada uno (enlace al rol).

### Crear un rol reutilizando features existentes

1. **Aplicaciones →** aplicación → **Roles → Nuevo rol**.
2. En **Funcionalidades**, escribe en *Vincular funcionalidades existentes* (≥ 2 caracteres) y pulsa **Vincular** en las que quieras. Aparecen con la etiqueta **Vinculada** (no se editan aquí: son compartidas).
3. Puedes combinarlas con funcionalidades nuevas (**+ Agregar funcionalidad**) y pulsar **Crear rol**.

---

## 5. Fuera de alcance / pendiente

* Alta/edición de contactos de entidades externas desde la UI (hoy solo por API).
* Vincular una feature existente a un rol **ya creado**: el selector solo está disponible al crear el rol; no se expuso un flujo de vinculación para roles existentes.
* `GET /roles` (todos los roles) sigue existiendo en el servicio Angular (`RoleService.getAll`); no se usa en estas pantallas y conviene revisarlo con el mismo criterio.
