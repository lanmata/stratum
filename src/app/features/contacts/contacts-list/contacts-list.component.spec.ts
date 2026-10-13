import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { ContactTypeService } from '@core/services/contact-type.service';
import { ContactService } from '@core/services/contact.service';
import { ToastService } from '@core/services/toast.service';
import { Contact } from '@shared/models/contact.model';
import { ContactsListComponent } from './contacts-list.component';

const email = { id: 't1', name: 'Email', active: true };
const phone = { id: 't2', name: 'Teléfono', active: true };
const contacts: Contact[] = [
  { id: 'c1', content: 'ana@x.com', contactType: email, personId: 'person-0001', active: true },
  { id: 'c2', content: '555-1234', contactType: phone, personId: 'person-0002', active: false },
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `x${i}`,
    content: `extra${i}@x.com`,
    contactType: email,
    personId: `person-${i}`,
    active: true,
  })),
];

describe('ContactsListComponent', () => {
  let service: jasmine.SpyObj<ContactService>;
  let types: jasmine.SpyObj<ContactTypeService>;
  let toast: jasmine.SpyObj<ToastService>;

  async function create(list: unknown = of(contacts), typeList: unknown = of([email, phone])) {
    service = jasmine.createSpyObj('ContactService', ['getAll', 'getByIds']);
    types = jasmine.createSpyObj('ContactTypeService', ['getAll']);
    toast = jasmine.createSpyObj('ToastService', ['error']);
    service.getAll.and.returnValue(list as never);
    service.getByIds.and.returnValue(of([contacts[1]]));
    types.getAll.and.returnValue(typeList as never);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ContactService, useValue: service },
        { provide: ContactTypeService, useValue: types },
        { provide: ToastService, useValue: toast },
      ],
    });
    const fixture = TestBed.createComponent(ContactsListComponent);
    fixture.detectChanges();
    const dom = new Dom(fixture);
    await dom.stable();
    return dom;
  }

  it('lists contacts with type, person link and status, paginated', async () => {
    const dom = await create();
    expect(dom.qa('tbody tr').length).toBe(10);
    expect(dom.text).toContain('ana@x.com');
    expect(dom.text).toContain('Email');
    expect(dom.q('a[href="/people/person-0001/edit"]')).not.toBeNull();
    expect(dom.text).toContain('12 contactos');
    dom.clickByText('button', 'Siguiente');
    expect(dom.qa('tbody tr').length).toBe(2);
    expect(dom.text).toContain('Página 2 de 2');
    dom.clickByText('button', 'Anterior');
    expect(dom.text).toContain('Página 1 de 2');
  });

  it('shows inactive contacts', async () => {
    const dom = await create(of([contacts[1]]));
    expect(dom.text).toContain('Inactivo');
  });

  it('filters by content and type', async () => {
    const dom = await create();
    dom.type('input[aria-label="Buscar por contenido"]', 'ANA');
    expect(dom.qa('tbody tr').length).toBe(1);
    dom.type('input[aria-label="Buscar por contenido"]', '');
    dom.type('select[aria-label="Filtrar por tipo"]', 't2');
    expect(dom.qa('tbody tr').length).toBe(1);
    expect(dom.text).toContain('555-1234');
    dom.type('select[aria-label="Filtrar por tipo"]', '');
    expect(dom.qa('tbody tr').length).toBe(10);
  });

  it('filters by ids through the API and reloads everything when cleared', async () => {
    const dom = await create();
    dom.type('input[aria-label="Filtrar por IDs"]', 'c2, c9');
    dom.submit();
    expect(service.getByIds).toHaveBeenCalledWith(['c2', 'c9']);
    expect(dom.qa('tbody tr').length).toBe(1);

    service.getAll.calls.reset();
    dom.type('input[aria-label="Filtrar por IDs"]', '');
    dom.submit();
    expect(service.getAll).toHaveBeenCalled();
  });

  it('shows the empty state and works when contact types fail to load', async () => {
    const dom = await create(of([]), throwError(() => new Error('x')));
    expect(dom.text).toContain('No se encontraron contactos');
    expect(dom.qa('select[aria-label="Filtrar por tipo"] option').length).toBe(1);
  });

  it('reports load errors', async () => {
    const dom = await create(throwError(() => new Error('x')));
    expect(toast.error).toHaveBeenCalledWith('Error al cargar los contactos');
    expect(dom.text).not.toContain('Cargando');
  });
});
