import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { ContactService } from '@core/services/contact.service';
import { ContactTypeService } from '@core/services/contact-type.service';
import { ToastService } from '@core/services/toast.service';
import { Contact } from '@shared/models/contact.model';
import { Page } from '@shared/models/page.model';
import { ApplicationContactsComponent } from './application-contacts.component';

const email = { id: 't1', name: 'Email', active: true };

const contacts: Contact[] = [
  { id: 'c1', content: 'ana@a.com', contactType: email, personId: 'p1234567890', applicationId: 'a1', active: true },
  {
    id: 'c2',
    content: 'shop@a.com',
    contactType: email,
    applicationId: 'a1',
    ownerType: 'MERCHANT',
    ownerId: 'm1234567890',
    active: false,
  },
];

function page(content: Contact[], opts: Partial<Page<Contact>> = {}): Page<Contact> {
  return { content, page: 0, size: 20, totalElements: content.length, totalPages: 1, ...opts };
}

describe('ApplicationContactsComponent', () => {
  let service: jasmine.SpyObj<ContactService>;
  let types: jasmine.SpyObj<ContactTypeService>;
  let toast: jasmine.SpyObj<ToastService>;

  function create() {
    service = jasmine.createSpyObj('ContactService', ['search']);
    types = jasmine.createSpyObj('ContactTypeService', ['getAll']);
    toast = jasmine.createSpyObj('ToastService', ['error']);
    service.search.and.returnValue(of(page(contacts)));
    types.getAll.and.returnValue(of([email]));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ContactService, useValue: service },
        { provide: ContactTypeService, useValue: types },
        { provide: ToastService, useValue: toast },
        {
          provide: ActivatedRoute,
          useValue: { parent: { snapshot: { paramMap: convertToParamMap({ applicationId: 'a1' }) } } },
        },
      ],
    });
    const fixture = TestBed.createComponent(ApplicationContactsComponent);
    fixture.detectChanges();
    return new Dom(fixture);
  }

  it('loads only the first page of THIS application', () => {
    const dom = create();
    expect(service.search).toHaveBeenCalledWith({
      applicationId: 'a1',
      contactTypeId: undefined,
      active: undefined,
      q: '',
      page: 0,
      size: 20,
    });
    expect(dom.qa('tbody tr').length).toBe(2);
    expect(dom.text).toContain('2 contactos');
  });

  it('links person contacts to the person and labels external owners', () => {
    const dom = create();
    const link = dom.q<HTMLAnchorElement>('tbody a')!;
    expect(link.getAttribute('href')).toBe('/people/p1234567890/edit');
    expect(dom.text).toContain('Persona · p1234567');
    expect(dom.text).toContain('MERCHANT · m1234567');
    expect(dom.text).toContain('Inactivo');
  });

  it('searches server-side after a pause, resetting to the first page', fakeAsync(() => {
    const dom = create();
    service.search.calls.reset();
    dom.type('input[aria-label="Buscar por contenido"]', 'an');
    dom.type('input[aria-label="Buscar por contenido"]', ' ana ');
    expect(service.search).not.toHaveBeenCalled();
    tick(300);
    dom.fixture.detectChanges();
    expect(service.search).toHaveBeenCalledTimes(1);
    expect(service.search.calls.mostRecent().args[0]).toEqual(
      jasmine.objectContaining({ applicationId: 'a1', q: ' ana ', page: 0 }),
    );
  }));

  it('filters by contact type and status on the server', () => {
    const dom = create();
    dom.type('select[aria-label="Filtrar por tipo"]', 't1');
    expect(service.search.calls.mostRecent().args[0]).toEqual(
      jasmine.objectContaining({ contactTypeId: 't1', page: 0 }),
    );
    dom.type('select[aria-label="Filtrar por estado"]', 'false');
    expect(service.search.calls.mostRecent().args[0]).toEqual(
      jasmine.objectContaining({ contactTypeId: 't1', active: false }),
    );
    dom.type('select[aria-label="Filtrar por estado"]', 'true');
    expect(service.search.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ active: true }));
    dom.type('select[aria-label="Filtrar por estado"]', '');
    expect(service.search.calls.mostRecent().args[0].active).toBeUndefined();
  });

  it('paginates through the server-side pages', () => {
    const dom = create();
    service.search.and.returnValue(of(page(contacts, { totalElements: 45, totalPages: 3 })));
    dom.type('select[aria-label="Filtrar por tipo"]', '');
    expect(dom.text).toContain('Página 1 de 3');
    expect(dom.text).toContain('45 contactos');

    service.search.and.returnValue(of(page(contacts, { page: 1, totalElements: 45, totalPages: 3 })));
    dom.clickByText('button', 'Siguiente');
    expect(service.search.calls.mostRecent().args[0].page).toBe(1);
    expect(dom.text).toContain('Página 2 de 3');

    dom.clickByText('button', 'Anterior');
    expect(service.search.calls.mostRecent().args[0].page).toBe(0);
  });

  it('does not request pages outside the available range', () => {
    const dom = create();
    service.search.and.returnValue(of(page(contacts, { totalElements: 45, totalPages: 3 })));
    dom.type('select[aria-label="Filtrar por tipo"]', '');
    const calls = service.search.calls.count();
    (dom.fixture.componentInstance as unknown as { goTo(p: number): void }).goTo(-1);
    (dom.fixture.componentInstance as unknown as { goTo(p: number): void }).goTo(3);
    expect(service.search.calls.count()).toBe(calls);
  });

  it('shows the empty state', () => {
    TestBed.resetTestingModule();
    const dom = create();
    service.search.and.returnValue(of(page([])));
    dom.type('select[aria-label="Filtrar por tipo"]', '');
    expect(dom.text).toContain('No se encontraron contactos');
  });

  it('reports load errors', () => {
    TestBed.resetTestingModule();
    service = jasmine.createSpyObj('ContactService', ['search']);
    types = jasmine.createSpyObj('ContactTypeService', ['getAll']);
    toast = jasmine.createSpyObj('ToastService', ['error']);
    service.search.and.returnValue(throwError(() => new Error('x')));
    types.getAll.and.returnValue(of([]));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ContactService, useValue: service },
        { provide: ContactTypeService, useValue: types },
        { provide: ToastService, useValue: toast },
        {
          provide: ActivatedRoute,
          useValue: { parent: { snapshot: { paramMap: convertToParamMap({ applicationId: 'a1' }) } } },
        },
      ],
    });
    const fixture = TestBed.createComponent(ApplicationContactsComponent);
    fixture.detectChanges();
    expect(toast.error).toHaveBeenCalledWith('Error al cargar los contactos');
    expect(new Dom(fixture).text).not.toContain('Cargando');
  });
});
