# Componentes Compartidos — Requisitos de Implementación

> Infraestructura UI reutilizable requerida por todos los módulos CRUD. Debe implementarse primero — es bloqueante para el resto de los requisitos.

---

## 1. Estado Actual

| Elemento | Estado | Detalle |
|---|---|---|
| `src/app/shared/components/` | ❌ No existe | El directorio no existe |
| `ConfirmDialogComponent` | ❌ Pendiente | Necesario para todas las acciones de eliminación |
| `ToastService` | ❌ Pendiente | Necesario para feedback de operaciones CRUD |
| `ToastComponent` | ❌ Pendiente | Vista global de notificaciones |

---

## 2. Alcance Funcional

1. **`ConfirmDialogComponent`** — Modal de confirmación genérico para acciones destructivas o irreversibles (eliminar, revocar tokens, rotar secretos). Muestra un título, mensaje configurable y dos botones: Cancelar y Confirmar.

2. **`ToastService`** — Servicio de señales que mantiene una pila de notificaciones activas. Expone métodos `success()`, `error()`, `info()`. Las notificaciones se auto-descartan pasado un tiempo configurable.

3. **`ToastComponent`** — Componente raíz que renderiza el stack de toasts. Se registra una sola vez en el layout de la aplicación.

---

## 3. Modelos de Datos

```typescript
// src/app/shared/models/toast.model.ts
export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number; // ms, 0 = persistente hasta dismiss manual
}
```

---

## 4. Tareas de Implementación

### 4.1 Capa BFF (`server/`)
No aplica — componentes puramente frontend.

### 4.2 Capa de Servicio Angular

**Archivo:** `src/app/core/services/toast.service.ts`

| Propiedad / Método | Tipo / Firma | Descripción |
|---|---|---|
| `toasts` | `Signal<Toast[]>` | Lista reactiva de notificaciones activas |
| `success(message, duration?)` | `(string, number?) => void` | Toast verde, 4000 ms por defecto |
| `error(message, duration?)` | `(string, number?) => void` | Toast rojo, 8000 ms por defecto (0 = manual) |
| `info(message, duration?)` | `(string, number?) => void` | Toast azul, 4000 ms por defecto |
| `dismiss(id)` | `(string) => void` | Elimina un toast por ID |

Implementación de señales:
```typescript
// Patrón interno
private _toasts = signal<Toast[]>([]);
readonly toasts = this._toasts.asReadonly();
```

### 4.3 Capa de Interfaz Angular

**Árbol de archivos a crear:**

```
src/app/shared/
├── components/
│   ├── confirm-dialog/
│   │   └── confirm-dialog.component.ts    ← modal de confirmación
│   └── toast/
│       └── toast.component.ts             ← stack de notificaciones
└── models/
    └── toast.model.ts                     ← interfaces Toast y ToastType
```

**`ConfirmDialogComponent`** — Uso en componentes consumidores:

```typescript
// El componente padre declara un signal local:
showConfirm = signal(false);
pendingId = signal<string | null>(null);

onDeleteClick(id: string) {
  this.pendingId.set(id);
  this.showConfirm.set(true);
}

onConfirmed() {
  this.service.delete(this.pendingId()!).subscribe(...);
  this.showConfirm.set(false);
}
```

```html
@if (showConfirm()) {
  <app-confirm-dialog
    message="¿Eliminar este registro? Esta acción no se puede deshacer."
    (confirmed)="onConfirmed()"
    (cancelled)="showConfirm.set(false)"
  />
}
```

**Inputs/Outputs de `ConfirmDialogComponent`:**

| API | Tipo | Descripción |
|---|---|---|
| `title` | `input<string>()` | Título del modal (default: "Confirmar acción") |
| `message` | `input.required<string>()` | Mensaje explicativo |
| `confirmLabel` | `input<string>()` | Texto botón confirmar (default: "Confirmar") |
| `cancelLabel` | `input<string>()` | Texto botón cancelar (default: "Cancelar") |
| `confirmStyle` | `input<'danger' \| 'primary'>()` | Estilo del botón confirmar (default: 'danger') |
| `confirmed` | `output<void>()` | Evento al confirmar |
| `cancelled` | `output<void>()` | Evento al cancelar |

**`ToastComponent`** — Se agrega al template raíz (`app.html`) una sola vez:

```html
<!-- app.html — junto al router-outlet -->
<app-toast />
```

El componente itera sobre `toastService.toasts()` con `@for` y aplica clases Tailwind según el tipo.

---

## 5. Reutilización vs. Creación

| Archivo | Acción | Detalle |
|---|---|---|
| `src/app/shared/components/` | **CREAR** | Directorio nuevo |
| `src/app/shared/components/confirm-dialog/confirm-dialog.component.ts` | **CREAR** | Componente nuevo standalone |
| `src/app/shared/components/toast/toast.component.ts` | **CREAR** | Componente nuevo standalone |
| `src/app/core/services/toast.service.ts` | **CREAR** | Servicio nuevo |
| `src/app/shared/models/toast.model.ts` | **CREAR** | Interfaces nuevas |
| `src/app/app.html` | **EXTENDER** | Agregar `<app-toast />` |

---

## 6. Dependencias

Ninguna dependencia de otros requisitos — este es el punto de partida de la cadena.

---

## 7. Criterios de Aceptación

- [ ] `ConfirmDialogComponent` aparece como overlay modal al activarse
- [ ] Hacer clic en "Cancelar" cierra el modal sin ejecutar ninguna acción
- [ ] Hacer clic en "Confirmar" emite el evento `confirmed` y el padre ejecuta la acción
- [ ] El modal se cierra al presionar `Escape` (keydown listener)
- [ ] `ToastService.success()` muestra un toast verde que desaparece tras 4 s
- [ ] `ToastService.error()` muestra un toast rojo — persiste 8 s o hasta dismiss manual
- [ ] `ToastService.info()` muestra un toast azul que desaparece tras 4 s
- [ ] Múltiples toasts se apilan sin solaparse
- [ ] El dismiss manual con ✕ funciona en todos los tipos
- [ ] Ambos componentes son `standalone: true` y SSR-safe (sin acceso directo a DOM)
- [ ] `ToastComponent` está registrado una única vez en el layout raíz

---

## 8. Notas Técnicas

- `ConfirmDialogComponent` **no usa un servicio de overlay** — se instancia inline en el template del padre controlado por un signal local. Esto evita complejidad de portal/CDK y es SSR-safe.
- El `id` de cada `Toast` se genera con `crypto.randomUUID()` (disponible en Node y browsers modernos).
- Los timeouts de auto-dismiss se gestionan con `setTimeout` dentro del servicio; al hacer `dismiss()` se debe limpiar el timeout con `clearTimeout` para evitar memory leaks.
- Usar clases Tailwind para los colores: `bg-green-500` (success), `bg-red-500` (error), `bg-blue-500` (info).
