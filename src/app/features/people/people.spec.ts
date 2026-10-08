import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { PersonService } from '@core/services/person.service';
import { ToastService } from '@core/services/toast.service';
import { Component, input } from '@angular/core';
import { PersonContactsComponent } from '@shared/components/person-contacts/person-contacts.component';
import { PersonAddressesComponent } from '@shared/components/person-addresses/person-addresses.component';
import { PersonIdentificationDocumentsComponent } from '@shared/components/person-identification-documents/person-identification-documents.component';
import { PeopleListComponent } from './people-list/people-list.component';
import { PersonFormComponent } from './person-form/person-form.component';

@Component({ selector: 'app-person-contacts', standalone: true, template: 'contacts' })
class FakeContacts {
  personId = input<string>();
}
@Component({ selector: 'app-person-addresses', standalone: true, template: 'addresses' })
class FakeAddresses {
  personId = input<string>();
}
@Component({ selector: 'app-person-identification-documents', standalone: true, template: 'docs' })
class FakeDocs {
  personId = input<string>();
}

const ana = { id: 'p1', firstName: 'Ana', lastName: 'Pérez', middleName: 'M', gender: 'F', birthdate: '1990-01-01' };

describe('PeopleListComponent', () => {
  function create(source = of([ana, { id: 'p2', firstName: 'Luis', lastName: 'Gil' }])) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: PersonService, useValue: { getAll: () => source } }],
    });
    const fixture = TestBed.createComponent(PeopleListComponent);
    fixture.detectChanges();
    return new Dom(fixture);
  }

  it('lists people with edit links', () => {
    const dom = create();
    expect(dom.text).toContain('Ana');
    expect(dom.text).toContain('Luis');
    expect(dom.q('a[href="/people/p1/edit"]')).not.toBeNull();
    expect(dom.q('a[href="/people/new"]')).not.toBeNull();
  });

  it('renders the empty state', () => {
    expect(create(of([])).qa('tbody tr').length).toBeLessThanOrEqual(1);
  });

  it('stops loading when the request fails', () => {
    const dom = create(throwError(() => new Error('x')) as never);
    expect(dom.text).not.toContain('Cargando');
  });
});

describe('PersonFormComponent', () => {
  let service: jasmine.SpyObj<PersonService>;
  let toast: jasmine.SpyObj<ToastService>;
  let router: Router;

  function create(id: string | null) {
    service = jasmine.createSpyObj('PersonService', ['getById', 'create', 'update']);
    service.getById.and.returnValue(of(ana));
    service.create.and.returnValue(of(ana));
    service.update.and.returnValue(of(ana));
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PersonService, useValue: service },
        { provide: ToastService, useValue: toast },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { personId: id } : {}) } } },
      ],
    });
    TestBed.overrideComponent(PersonFormComponent, {
      remove: { imports: [PersonContactsComponent, PersonAddressesComponent, PersonIdentificationDocumentsComponent] },
      add: { imports: [FakeContacts, FakeAddresses, FakeDocs] },
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(PersonFormComponent);
    fixture.detectChanges();
    return new Dom(fixture);
  }

  it('requires first and last name', () => {
    const dom = create(null);
    expect(dom.text).toContain('Nueva');
    expect(dom.q<HTMLButtonElement>('button[type=submit]')!.disabled).toBeTrue();
    for (const c of ['firstName', 'lastName']) {
      dom.q(`input[formControlName=${c}]`)!.dispatchEvent(new Event('blur'));
    }
    dom.fixture.detectChanges();
    dom.submit();
    expect(service.create).not.toHaveBeenCalled();
    expect(dom.q('app-person-contacts')).toBeNull();
  });

  it('creates a person, omitting empty optional fields', () => {
    const dom = create(null);
    dom.type('input[formControlName=firstName]', 'Zoe');
    dom.type('input[formControlName=lastName]', 'Zeta');
    dom.submit();
    const req = service.create.calls.mostRecent().args[0];
    expect(req.person).toEqual({
      id: undefined,
      firstName: 'Zoe',
      lastName: 'Zeta',
      middleName: undefined,
      gender: undefined,
      birthdate: undefined,
    });
    expect(toast.success).toHaveBeenCalledWith('Persona creada');
    expect(router.navigate).toHaveBeenCalledWith(['/people']);
  });

  it('loads, edits and shows the person-scoped sections', () => {
    const dom = create('p1');
    expect(dom.q<HTMLInputElement>('input[formControlName=firstName]')!.value).toBe('Ana');
    expect(dom.q('app-person-contacts')).not.toBeNull();
    expect(dom.q('app-person-addresses')).not.toBeNull();
    expect(dom.q('app-person-identification-documents')).not.toBeNull();
    dom.type('input[formControlName=middleName]', 'Nueva');
    dom.type('input[formControlName=gender]', 'X');
    dom.type('input[formControlName=birthdate]', '2000-02-02');
    dom.submit();
    const [id, req] = service.update.calls.mostRecent().args;
    expect(id).toBe('p1');
    expect(req.person).toEqual(jasmine.objectContaining({ id: 'p1', middleName: 'Nueva', gender: 'X', birthdate: '2000-02-02' }));
    expect(toast.success).toHaveBeenCalledWith('Persona actualizada');
  });

  it('reports save and load errors', () => {
    let dom = create(null);
    service.create.and.returnValue(throwError(() => new Error('x')));
    dom.type('input[formControlName=firstName]', 'A');
    dom.type('input[formControlName=lastName]', 'B');
    dom.submit();
    expect(toast.error).toHaveBeenCalledWith('Error al guardar la persona');
    expect(dom.q<HTMLButtonElement>('button[type=submit]')!.disabled).toBeFalse();

    TestBed.resetTestingModule();
    service = jasmine.createSpyObj('PersonService', ['getById']);
    service.getById.and.returnValue(throwError(() => new Error('x')));
    toast = jasmine.createSpyObj('ToastService', ['error']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PersonService, useValue: service },
        { provide: ToastService, useValue: toast },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ personId: 'p1' }) } } },
      ],
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    TestBed.createComponent(PersonFormComponent).detectChanges();
    expect(toast.error).toHaveBeenCalledWith('Error al cargar la persona');
    expect(router.navigate).toHaveBeenCalledWith(['/people']);
    dom = undefined as never;
  });
});
