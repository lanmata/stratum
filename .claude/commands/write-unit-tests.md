# Write Unit Tests

Write Jasmine 5 + Karma 6 unit tests for an Angular component or service.

**Usage:** `/write-unit-tests <targetFile> <targetType>`

Example: `/write-unit-tests src/app/core/services/user.service.ts service`
Example: `/write-unit-tests src/app/features/users/users-list/users-list.component.ts component`

---

Agent: test-writer

Read `.claude/skills/test-writer.skill.md` and `.claude/skills/component-patterns.skill.md` before starting.

## Inputs (from $ARGUMENTS)

Parse from $ARGUMENTS:
- `targetFile` — path to the source file to test
- `targetType` — `component` / `service` / `guard` / `interceptor`

Spec file location: same directory as source — `<source-name>.spec.ts`

## Step 1 — Read the Source

1. Read `$targetFile` in full.
2. If the spec file already exists, read it — match its existing style exactly.
3. Read `src/app/app.spec.ts` — canonical test reference.
4. Identify all `inject()` dependencies (must be spied in `TestBed`).

## Step 2 — Set Up TestBed

### For a component:
```typescript
import { TestBed } from '@angular/core/testing';
import { <ComponentClass> } from './<componentFile>';
import { <ServiceClass> } from '@core/services/<serviceFile>';
import { of } from 'rxjs';

describe('<ComponentClass>', () => {
  let <serviceSpy>: jasmine.SpyObj<<ServiceClass>>;

  beforeEach(async () => {
    <serviceSpy> = jasmine.createSpyObj('<ServiceClass>', ['<methods>']);
    <serviceSpy>.<method>.and.returnValue(of(<mockValue>));

    await TestBed.configureTestingModule({
      imports: [<ComponentClass>],
      providers: [{ provide: <ServiceClass>, useValue: <serviceSpy> }],
    }).compileComponents();
  });
});
```

### For a service:
```typescript
import { TestBed } from '@angular/core/testing';
import { <ServiceClass> } from './<serviceFile>';
import { HttpService } from './http.service';
import { of, throwError } from 'rxjs';

describe('<ServiceClass>', () => {
  let service: <ServiceClass>;
  let httpSpy: jasmine.SpyObj<HttpService>;

  beforeEach(() => {
    httpSpy = jasmine.createSpyObj('HttpService', ['get', 'post', 'put', 'delete', 'patch']);
    TestBed.configureTestingModule({
      providers: [<ServiceClass>, { provide: HttpService, useValue: httpSpy }],
    });
    service = TestBed.inject(<ServiceClass>);
  });
});
```

## Step 3 — Write Test Cases

For every **public method**, write at minimum:
1. A success test: spy returns `of(mockValue)`, assert result and spy call.
2. An error test: spy returns `throwError(() => new Error('fail'))`, assert error handling.

For every **component**, write:
1. `'should create'` — `expect(fixture.componentInstance).toBeTruthy()`
2. `'should call service on init'` — call `detectChanges()`, assert spy was called
3. `'should show error message when service fails'` — spy throws, assert error signal

## Step 4 — Run Tests

```bash
npm run test:headless
```

All tests must pass. Fix any failures before reporting done.

## Constraints

- Test file adjacent to source (`<name>.spec.ts` same directory)
- Never import real `HttpService` — always spy it
- Never use `RouterTestingModule` — spy `Router` with `jasmine.createSpyObj`
- `fixture.detectChanges()` required before template assertions
- `fdescribe` / `fit` must be removed before committing

## Output

- Spec file: CREATED / MODIFIED
- Test cases added: N (list `describe` + `it` names)
- `npm run test:headless`: ✓ / ✗
