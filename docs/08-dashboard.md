# Dashboard — Requisitos de Implementación

> Actualización de la navegación del dashboard para incluir los tres módulos nuevos: Aplicaciones, Clientes M2M y Tipos de Contacto. Requiere cambios mínimos en dos archivos existentes.

---

## 1. Estado Actual

| Elemento | Estado | Detalle |
|---|---|---|
| `DashboardComponent` | ⚠️ Incompleto | 6 tarjetas actuales — faltan 3 módulos nuevos |
| `app.routes.ts` | ⚠️ Incompleto | 7 rutas actuales — faltan 3 rutas lazy |
| Tarjeta Aplicaciones | ❌ Pendiente | No existe |
| Tarjeta Clientes M2M | ❌ Pendiente | No existe |
| Tarjeta Tipos de Contacto | ❌ Pendiente | No existe |

---

## 2. Alcance Funcional

1. Agregar tarjeta de navegación para **Aplicaciones** → `/applications`
2. Agregar tarjeta de navegación para **Clientes M2M** → `/managed-clients`
3. Agregar tarjeta de navegación para **Tipos de Contacto** → `/contact-types`
4. Agregar las 3 rutas lazy correspondientes en `app.routes.ts`

---

## 3. Tareas de Implementación

### 3.1 Actualizar `DashboardComponent`

**Archivo:** `src/app/features/dashboard/dashboard.component.ts`

Agregar al array `navItems` (o equivalente en el template):

```typescript
// Módulos nuevos — agregar a la lista existente
{ path: '/applications',    icon: '🏢', label: 'Aplicaciones',      description: 'Registrar aplicaciones del sistema' },
{ path: '/managed-clients', icon: '🤖', label: 'Clientes M2M',      description: 'Clientes OAuth2 machine-to-machine' },
{ path: '/contact-types',   icon: '🏷️', label: 'Tipos de Contacto', description: 'Catálogo de tipos de contacto' },
```

**Tarjetas actuales (referencia para mantener consistencia de orden):**

| Orden actual | Módulo | Path |
|---|---|---|
| 1 | Usuarios | `/users` |
| 2 | Roles | `/roles` |
| 3 | Personas | `/people` |
| 4 | Contactos | `/contacts` |
| 5 | Features | `/features-mgmt` |
| 6 | Auditoría | `/audit` |

**Orden sugerido para los nuevos (agregar al final o agregar sección):**

| Orden nuevo | Módulo | Path |
|---|---|---|
| 7 | Aplicaciones | `/applications` |
| 8 | Clientes M2M | `/managed-clients` |
| 9 | Tipos de Contacto | `/contact-types` |

### 3.2 Actualizar `app.routes.ts`

**Archivo:** `src/app/app.routes.ts`

Agregar las 3 rutas lazy antes del catch-all `**`:

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

---

## 4. Reutilización vs. Creación

| Archivo | Acción | Detalle |
|---|---|---|
| `src/app/features/dashboard/dashboard.component.ts` | **EXTENDER** | Agregar 3 navItems |
| `src/app/app.routes.ts` | **EXTENDER** | Agregar 3 rutas lazy con `authGuard` |

---

## 5. Dependencias

- [02 · Tipos de Contacto](./02-tipos-contacto.md) — módulo `contact-types` debe existir
- [06 · Aplicaciones](./06-aplicaciones.md) — módulo `applications` debe existir
- [07 · Clientes Gestionados](./07-clientes-gestionados.md) — módulo `managed-clients` debe existir

---

## 6. Criterios de Aceptación

- [ ] El dashboard muestra 9 tarjetas de navegación (6 existentes + 3 nuevas)
- [ ] La tarjeta "Aplicaciones" navega a `/applications`
- [ ] La tarjeta "Clientes M2M" navega a `/managed-clients`
- [ ] La tarjeta "Tipos de Contacto" navega a `/contact-types`
- [ ] Las 3 rutas nuevas están protegidas por `authGuard`
- [ ] Navegar directamente a `/applications`, `/managed-clients`, `/contact-types` sin sesión redirige a `/auth/login`
- [ ] Las tarjetas nuevas tienen el mismo estilo visual que las existentes

---

## 7. Notas Técnicas

- Los módulos de las 3 rutas nuevas son lazy-loaded — no se cargan hasta que el usuario navega a ellos, lo que mantiene el bundle inicial pequeño.
- El `authGuard` ya está implementado en `src/app/core/guards/auth.guard.ts` — reutilizar sin cambios.
- Verificar que el archivo de rutas exportado por cada módulo use el nombre de export correcto (`applicationsRoutes`, `managedClientsRoutes`, `contactTypesRoutes`) para que el `import().then(m => m.xxx)` resuelva correctamente.
