# Implement Component

Create a single Angular 20 standalone component in front-backbone-rest.

**Usage:** `/implement-component <componentName> <selector> <featurePath> <purpose>`

Example: `/implement-component RoleBadge role-badge src/app/features/roles/role-badge "Displays a role name as a colored badge"`

---

Agent: developer

Read `.claude/skills/component-patterns.skill.md` before starting.

## Inputs (from $ARGUMENTS)

Parse from $ARGUMENTS:
- `componentName` — PascalCase class name (e.g. `RoleBadgeComponent`)
- `selector` — kebab-case selector without `app-` prefix (e.g. `role-badge`)
- `featurePath` — directory path (e.g. `src/app/features/roles/role-badge/`)
- `purpose` — what this component does

## Step 1 — Read Existing Pattern

Before creating anything:
1. Read `src/app/features/users/users-list/users-list.component.ts` — canonical reference.
2. If the component uses a service, read that service file for its API.

## Step 2 — Create the Component File

Create `<featurePath>/<selector>.component.ts`.

Required structure:
```typescript
import { Component, inject, signal } from '@angular/core';
// import only what this template actually uses

@Component({
  selector: 'app-<selector>',
  standalone: true,
  imports: [/* only used directives/components */],
  template: `
    <!-- Tailwind utility classes -->
    <!-- @if / @for / @let — never *ngIf / *ngFor -->
  `,
})
export class <ComponentName> {
  // private readonly service = inject(SomeService);
  // protected readonly state = signal<T>(initial);
}
```

Rules:
- `standalone: true` — always
- `inject()` for DI — no constructor parameters
- `protected readonly` for signals accessed by template
- `private readonly` for injected services
- Tailwind v4 utility classes — no separate `.css` file
- Inline template — no `templateUrl`

## Step 3 — Register (if routed)

If this component is the target of a route:

```typescript
// in the feature route file
{
  path: '<routePath>',
  loadComponent: () =>
    import('./<selector>/<selector>.component').then((m) => m.<ComponentName>),
},
```

If it is a shared/reusable component, add it to the `imports` array of the parent component.

## Step 4 — Type Check

```bash
npx tsc --noEmit
```

## Constraints

- No `*ngIf` / `*ngFor` — use `@if` / `@for`
- No `HttpClient` injection — use `HttpService` via a service
- No `localStorage` — use `StorageMockService`
- No separate `.html` or `.css` files
- No constructor injection

## Output

- File created: `<featurePath>/<selector>.component.ts` — CREATED
- Type check: pass/fail
