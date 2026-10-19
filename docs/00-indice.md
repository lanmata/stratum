# Stratum — Índice de Módulos

> Estado real del backoffice de conectividad y gestión de usuarios/aplicaciones sobre backbone-rest, verificado contra el contrato actual del backend (`api.yaml`, sincronizado desde el repo hermano `backbone-rest`).

---

## Historia reciente (para no repetir el error)

La versión anterior de este índice (y de `youtrack-issues.md`) describía un plan construido sobre una API que todavía no existía del todo. Esa apuesta se resolvió así:

- **Correcta:** `addresses`, `identification-documents`, `notice-types` y `notices` — el backend las implementó de verdad, aunque con esquemas distintos a los que se habían adivinado (p. ej. `Address.content`, no `Address.address`; `IdentificationDocument` no es un catálogo `{name, description, active}` sino `{number, expirationDate, identificationType, personId}`).
- **Incorrecta:** `application-role-user` y `role-features` como módulos independientes — nunca se implementaron en el backend y no se van a construir. El diseño real es: los roles llevan sus features embebidas (se crean/editan junto con el rol), y los usuarios se asocian a roles vía los endpoints dedicados `link`/`unlink`.

Este documento describe **lo que existe hoy**, no un plan a futuro.

---

## Tabla Maestra de Módulos

| # | Módulo | Alcance | Estado |
|---|---|---|---|
| 01 | [Componentes Compartidos](./01-componentes-compartidos.md) | `ConfirmDialog`, `Toast` | ✅ Implementado |
| 02 | [Tipos de Contacto](./02-tipos-contacto.md) | Catálogo global, CRUD completo | ✅ Implementado |
| 03 | [Roles](./03-roles.md) | Scoped a aplicación, features embebidas, sin DELETE (no expuesto por la API) | ✅ Implementado |
| 04 | [Features](./04-features.md) | Ya no es un catálogo independiente — ver Roles | ✅ Implementado (fusionado en Roles) |
| 05 | [Usuarios](./05-usuarios.md) | Scoped a aplicación, CRUD + roles + contactos/direcciones/documentos de su persona | ✅ Implementado |
| 06 | [Aplicaciones](./06-aplicaciones.md) | CRUD completo (list/create/edit/detail), hub de pestañas | ✅ Implementado |
| 07 | [Clientes Gestionados (M2M)](./07-clientes-gestionados.md) | Scoped a aplicación, OAuth2 client-credentials | ✅ Implementado |
| 08 | [Dashboard](./08-dashboard.md) | Navegación a los módulos reales | ✅ Implementado |
| 09 | [Guía técnica — Docker](./09-guia-tecnica-docker.md) | Dockerfile, docker-compose, HTTPS en 443 (`stratum.umdc-qa.tst`) | ✅ Documentado |
| 10 | [Guía de usuario — Docker](./10-guia-usuario-docker.md) | Arranque y operación con Docker | ✅ Documentado |
| — | **Personas** | CRUD completo + contactos/direcciones/documentos de identificación (scoped a persona) | ✅ Implementado |
| — | **Tipos de Aviso** | Catálogo global, CRUD completo (clon de Tipos de Contacto) | ✅ Implementado |
| — | **Avisos** | Pestaña "Avisos" en Application Detail — registro/revocación de acuses de aviso por usuario | ✅ Implementado |

Todos los módulos de la tabla están implementados contra el `api.yaml` real a la fecha de este documento. Lo que queda fuera de alcance se detalla abajo.

---

## Arquitectura real

```
Stratum (Angular 22 + Express BFF)
├── /applications                      → lista + crear + detalle
│   └── /applications/:id              → hub con pestañas:
│       ├── /users                     → usuarios de esta aplicación
│       ├── /roles                     → roles de esta aplicación (features embebidas)
│       ├── /managed-clients           → clientes M2M OAuth2 de esta aplicación
│       └── /notices                   → avisos reconocidos por usuarios de esta aplicación
├── /people                            → personas (catálogo global)
│   └── /people/:id/edit               → ficha de persona con:
│       ├── Contactos                  → scoped a personId
│       ├── Direcciones                → scoped a personId
│       └── Documentos de identificación → scoped a personId
├── /contact-types                     → catálogo global
├── /service-types                     → catálogo global
├── /notice-types                      → catálogo global
└── /audit                             → lista de eventos de auditoría
```

Los gestores de Contactos/Direcciones/Documentos de identificación viven como componentes compartidos (`src/app/shared/components/person-*`) porque se usan en dos lugares: la ficha de persona (`/people/:id/edit`) y el formulario de usuario (`/applications/:id/users/:userId/edit`, ya que un usuario tiene una persona asociada).

---

## Convenciones Globales

Todos los módulos siguen las convenciones de `CLAUDE.md`:

| Convención | Regla |
|---|---|
| **Componentes** | `standalone: true` siempre |
| **Inyección** | `inject()` — nunca constructor injection |
| **Control de flujo** | `@if`, `@for` — nunca `*ngIf`/`*ngFor` |
| **HTTP** | Solo `HttpService` — nunca `HttpClient` directamente |
| **Estado global** | NgRx (sesión) — signals para estado local de componente |
| **URLs** | Siempre constantes de `API` en `api.constants.ts` |
| **SSR** | `StorageMockService` para `localStorage`/`window` |
| **Comentarios** | Solo si el WHY no es obvio |
| **Idioma UI** | Español (`es`) |
| **Package manager** | `pnpm`, no `npm` |

---

## Fuera de alcance (deliberado)

La API real también expone `profile/image/*` (logo por aplicación) y `report/*` (generación de documentos desde plantilla). No se construyó UI para ninguno de los dos:

- `profile/image/*` no fue pedido como parte de "conectividad y gestión de usuarios y aplicaciones".
- `report/*` es funcionalidad legacy que el propio backend ya no expone en su `api.yaml` actual más allá de lo documentado como tal.

Si se necesitan en el futuro, no requieren cambios arquitectónicos — siguen el mismo patrón BFF-proxy + servicio Angular + componente que el resto de los módulos.
