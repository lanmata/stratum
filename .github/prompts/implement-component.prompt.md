---
name: Implement Component
description: Creates a single Angular 20 standalone component in front-backbone-rest following all project conventions
mode: agent
agent: developer
tools: [run_in_terminal, read_file, grep_search, file_search, insert_edit_into_file, replace_string_in_file, create_file, get_errors]
---

# Implement Component

Create the Angular standalone component **`${componentName}`**.

- **Selector**: `app-${componentSelector}` (e.g. `app-role-badge`)
- **Feature path**: `${featurePath}` (e.g. `src/app/features/roles/role-badge/`)
- **Purpose**: ${componentPurpose}
- **Services needed**: ${services} (e.g. `RoleService` / `none`)

---

## Step 1 — Read Existing Pattern

Before creating anything:
1. Read `src/app/features/users/users-list/users-list.component.ts` — canonical component reference.
2. If the component uses a service, read `src/app/core/services/<entity>.service.ts` for its API.

---

## Step 2 — Create the Component File

Create `${featurePath}/${componentSelector}.component.ts`.

Required structure:
```typescript
import { Component, inject, signal } from '@angular/core';
// import only what this template actually uses

@Component({
  selector: 'app-${componentSelector}',
  standalone: true,
  imports: [/* only used directives/components */],
  template: `
    <!-- Tailwind utility classes inline -->
    <!-- Use @if / @for / @let / @empty — never *ngIf / *ngFor -->
  `,
})
export class ${ComponentClass} {
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

---

## Step 3 — Register (if it's a routed component)

If this component is the target of a route, add to the feature route file:

```typescript
// src/app/features/${featurePath}/<entity>.routes.ts
{
  path: '${routePath}',
  loadComponent: () =>
    import('./${componentSelector}/${componentSelector}.component')
      .then((m) => m.${ComponentClass}),
},
```

If it is a shared/reusable component (not routed), add it to the `imports` array of
the parent component that uses it.

---

## Step 4 — Type Check

```bash
npx tsc --noEmit
```

Fix any type errors before reporting done.

---

## Constraints

- No `*ngIf` / `*ngFor` — use `@if` / `@for`
- No `HttpClient` injection — use `HttpService` via a service
- No `localStorage` — use `StorageMockService`
- No separate `.html` or `.css` files
- No constructor injection

## Output

- File created: `${featurePath}/${componentSelector}.component.ts` — CREATED
- Type check: pass/fail
