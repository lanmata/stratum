---
name: Test Writer Skills
description: Jasmine 5 + Karma 6 unit test patterns for Angular 20 standalone components and injectable services in front-backbone-rest
applies-to: [Test Writer]
---

# Test Writer — Skill Definition

## 1. Component / Module Patterns

Test file is always adjacent to the source file: `<name>.spec.ts` in the same directory.
Import the standalone component directly into `imports:[]`.

```typescript
// src/app/features/users/users-list/users-list.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { UsersListComponent } from './users-list.component';
import { UserService } from '@core/services/user.service';
import { of } from 'rxjs';

describe('UsersListComponent', () => {
  let userServiceSpy: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['getByApplication']);
    userServiceSpy.getByApplication.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [UsersListComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(UsersListComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render table after data loads', () => {
    const fixture = TestBed.createComponent(UsersListComponent);
    fixture.detectChanges();
    expect(userServiceSpy.getByApplication).toHaveBeenCalled();
  });
});
```

## 2. Naming Conventions

| Artifact | Pattern |
|----------|---------|
| Spec file | Same directory as source, `<source-name>.spec.ts` |
| `describe` block | Class name: `'UsersListComponent'` / `'UserService'` |
| `it` block | Behaviour in plain language: `'should return false on login error'` |
| Spy variable | `<className>Spy`: `userServiceSpy`, `httpSpy`, `routerSpy` |

## 3. State Management Pattern (mocking)

```typescript
// Mock SessionStoreService
const storeSpy = jasmine.createSpyObj('SessionStoreService',
  ['save', 'clear', 'refresh'],
  { isAuthenticated$: of(true), token$: of('token') }
);

// Provide via TestBed
providers: [{ provide: SessionStoreService, useValue: storeSpy }]
```

## 4. Service Unit Test Pattern

```typescript
// src/app/core/services/user.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';
import { HttpService } from './http.service';
import { of, throwError } from 'rxjs';
import { UserTO } from '@shared/models/user.model';

describe('UserService', () => {
  let service: UserService;
  let httpSpy: jasmine.SpyObj<HttpService>;

  beforeEach(() => {
    httpSpy = jasmine.createSpyObj('HttpService', ['get', 'post', 'put', 'delete', 'patch']);
    TestBed.configureTestingModule({
      providers: [UserService, { provide: HttpService, useValue: httpSpy }],
    });
    service = TestBed.inject(UserService);
  });

  it('should call get with correct path for getById', () => {
    const mock = { id: 'abc' } as UserTO;
    httpSpy.get.and.returnValue(of(mock));
    service.getById('abc').subscribe((res) => expect(res).toEqual(mock));
    expect(httpSpy.get).toHaveBeenCalledWith('/v1/users/user/abc');
  });

  it('should propagate errors from get', (done) => {
    httpSpy.get.and.returnValue(throwError(() => new Error('fail')));
    service.getById('abc').subscribe({
      error: (err) => { expect(err.message).toBe('fail'); done(); },
    });
  });
});
```

## 5. Router and Signal Testing

```typescript
// Router spy
const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree']);
providers: [{ provide: Router, useValue: routerSpy }]

// Signal assertion — read after detectChanges
fixture.detectChanges();
expect(fixture.componentInstance.loading()).toBeFalse();
expect(fixture.componentInstance.items().length).toBe(2);
```

## 6. Key File Paths

```
src/app/app.spec.ts                           ← canonical pattern reference
src/app/features/users/users-list/            ← component test pattern
src/app/core/services/                        ← service test location
tsconfig.spec.json                            ← test TypeScript config
angular.json → test builder                   ← Karma config (no karma.conf.js)
```

## 7. Constraints

- Never use real HTTP — always spy `HttpService`
- Never use `RouterTestingModule` — provide `Router` as a spy
- Never call real NgRx store — spy `SessionStoreService` or provide a fake store
- Never use `useClass` — always `useValue` with a spy
- `fixture.detectChanges()` is required before any template assertions

## 8. Quality Checklist

- [ ] Spec file is adjacent to source file (same directory)
- [ ] `describe` block name matches class name
- [ ] All `inject()` dependencies are provided or spied in `TestBed`
- [ ] Both success and error paths are tested for each public method
- [ ] `fixture.detectChanges()` called before template assertions
- [ ] `npm run test:headless` passes with zero failures
