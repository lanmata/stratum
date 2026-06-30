---
name: Component Patterns
description: Shared — Angular 20 standalone component structure, template syntax, and signal state (Developer, Code Reviewer, Test Writer)
applies-to: [Developer, Code Reviewer, Test Writer]
---

# Component Patterns — Shared Skill

## Canonical Structure

Every component in front-backbone-rest follows this exact shape:

```typescript
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';          // only if needed
import { SomeService } from '@core/services/some.service';
import { SomeTO } from '@shared/models/some.model';

@Component({
  selector: 'app-<entity>-<role>',  // always app- prefix
  standalone: true,                  // always present
  imports: [RouterLink],             // only what this template uses
  template: `                        // inline — no separate .html file
    <!-- Tailwind utility classes only -->
  `,
  // No styleUrl — use Tailwind inline
})
export class SomeComponent implements OnInit {
  private readonly someService = inject(SomeService);  // private, readonly, inject()

  // Signal visibility: protected for template, private for internal
  protected readonly items = signal<SomeTO[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void { /* fetch data, set signals */ }
}
```

## Control Flow — Required Syntax

```html
<!-- Conditional (replace *ngIf) -->
@if (loading()) {
  <p>Loading…</p>
} @else {
  <div>content</div>
}

<!-- Loops (replace *ngFor) -->
@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
} @empty {
  <p>No items</p>
}

<!-- Local variable -->
@let user = currentUser();
<p>{{ user.displayName }}</p>
```

## Signal Patterns

```typescript
// Read (in template): item()
// Read (in class): this.items()
// Write: this.items.set(newValue)
// Update: this.items.update(prev => [...prev, newItem])
// Computed (derived): readonly total = computed(() => this.items().length)
```

## Import Rules

| Need | Import from |
|------|------------|
| Routing directives | `@angular/router` (`RouterLink`, `RouterOutlet`) |
| Forms | `@angular/forms` (`ReactiveFormsModule`, `FormsModule`) |
| HTTP | Never in components — use a service |
| i18n | `@ngx-translate/core` (`TranslateModule`) |
| Other components | The standalone component class directly |

## Things That Must Never Appear in a Component File

- `*ngIf`, `*ngFor` (use `@if`, `@for`)
- `HttpClient` injection
- `localStorage` access
- Hardcoded URL strings
- Constructor parameters for DI
- Separate `styleUrl` or `templateUrl` properties
- NgRx `Store` injection (use `SessionStoreService` facade)
