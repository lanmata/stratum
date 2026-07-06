# State Management — Shared Skill

Applies to: Developer, Code Reviewer

## Rule: NgRx for Session Only

NgRx is used exclusively for session state. All other state uses Angular signals.

```typescript
// CORRECT — local component state with signals
protected readonly items = signal<UserTO[]>([]);
protected readonly loading = signal(true);
protected readonly error = signal<string | null>(null);

// FORBIDDEN — BehaviorSubject for component state
private items$ = new BehaviorSubject<UserTO[]>([]);

// FORBIDDEN — adding a new NgRx slice outside session
// (never create new NgRx feature stores)
```

## Session Store — Facade Pattern

All session state flows through `SessionStoreService`. Components never import or inject `Store` directly.

```typescript
// CORRECT
private readonly session = inject(SessionStoreService);

// Read
this.session.isAuthenticated$  // Observable<boolean>
this.session.token$            // Observable<string | null>
this.session.user$             // Observable<UserTO | null>

// Write
this.session.save(token, refreshToken, user);  // dispatches saveSession
this.session.clear();                           // dispatches clearSession
this.session.refresh(token, refreshToken);     // dispatches refreshSession

// FORBIDDEN — direct store injection
private readonly store = inject(Store);
this.store.dispatch(saveSession({ ... }));
this.store.select(selectToken);
```

## Signal API

```typescript
// Declare
protected readonly count = signal(0);
protected readonly items = signal<string[]>([]);
protected readonly selected = signal<UserTO | null>(null);

// Read in template
{{ count() }}
@if (selected()) { ... }

// Read in class
const current = this.count();

// Write
this.count.set(5);
this.items.set([...newItems]);

// Update (based on previous value)
this.count.update(n => n + 1);
this.items.update(list => [...list, newItem]);

// Computed (derived, read-only)
protected readonly total = computed(() => this.items().length);
```

## Review Flags

The following patterns in a PR indicate incorrect state management:

| Pattern | Issue |
|---------|-------|
| `inject(Store)` in a component | Must use `SessionStoreService` facade |
| `new BehaviorSubject(...)` in a component | Use `signal()` instead |
| `createAction` / `createReducer` outside `core/store/session/` | No new NgRx slices allowed |
| `@ngrx/component-store` import | Not in this project — use signals |
