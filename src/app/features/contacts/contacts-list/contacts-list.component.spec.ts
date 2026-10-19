import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { ApplicationService } from '@core/services/application.service';
import { ContactTypeService } from '@core/services/contact-type.service';
import { ContactService } from '@core/services/contact.service';
import { ToastService } from '@core/services/toast.service';
import { Contact } from '@shared/models/contact.model';
import { PageResponse } from '@shared/models/page.model';
import { ContactsListComponent } from './contacts-list.component';

const email = { id: 't1', name: 'Email', active: true };
const phone = { id: 't2', name: 'Teléfono', active: true };
const apps = [
  { id: 'app-1', name: 'shop', active: true },
  { id: 'app-2', name: 'mercury', active: true },
];
const person: Contact = { id: 'c1', content: 'ana@x.com', contactType: email, personId: 'person-0001', active: true };
const merchant: Contact = {
  id: 'c2',
  content: '555-1234',
  contactType: phone,
  ownerType: 'MERCHANT',
  ownerId: 'owner-0001-xyz',
  applicationId: 'app-1',
  active: false,
};

function page(content: Contact[], pageIndex = 0, totalPages = 1, totalElements = content.length): PageResponse<Contact> {
  return { content, page: pageIndex, size: 20, totalElements, totalPages };
}

describe('ContactsListComponent', () => {
  let service: jasmine.SpyObj<ContactService>;
  let types: jasmine.SpyObj<ContactTypeService>;
  let applications: jasmine.SpyObj<ApplicationService>;
  let toast: jasmine.SpyObj<ToastService>;

  async function create(first: unknown = of(page([person, merchant])), typeList: unknown = of([email, phone])) {
    service = jasmine.createSpyObj('ContactService', ['search', 'getByIds', 'getByOwner']);
    types = jasmine.createSpyObj('ContactTypeService', ['getAll']);
    applications = jasmine.createSpyObj('ApplicationService', ['getAll']);
    toast = jasmine.createSpyObj('ToastService', ['error']);
    service.search.and.returnValue(first as never);
    service.getByIds.and.returnValue(of([merchant]));
    service.getByOwner.and.returnValue(of([merchant]));
    types.getAll.and.returnValue(typeList as never);
    applications.getAll.and.returnValue(of(apps) as never);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ContactService, useValue: service },
        { provide: ContactTypeService, useValue: types },
        { provide: ApplicationService, useValue: applications },
        { provide: ToastService, useValue: toast },
      ],
    });
    const fixture = TestBed.createComponent(ContactsListComponent);
    fixture.detectChanges();
    const dom = new Dom(fixture);
    await dom.stable();
    return dom;
  }

  it('loads the first application page from the server with its person and owner holders', async () => {
    const dom = await create();
    expect(service.search).toHaveBeenCalledWith({ applicationId: 'app-1', page: 0, size: 20 });
    expect(dom.qa('tbody tr').length).toBe(2);
    expect(dom.text).toContain('ana@x.com');
    expect(dom.q('a[href="/people/person-0001/edit"]')).not.toBeNull();
    expect(dom.text).toContain('MERCHANT · owner-00');
    expect(dom.text).toContain('Inactivo');
    expect(dom.text).toContain('2 contactos');
  });

  it('pages through the server', async () => {
    const dom = await create(of(page([person], 0, 3, 41)));
    expect(dom.text).toContain('Página 1 de 3');
    service.search.and.returnValue(of(page([merchant], 1, 3, 41)));
    dom.clickByText('button', 'Siguiente');
    expect(service.search).toHaveBeenCalledWith({ applicationId: 'app-1', page: 1, size: 20 });
    expect(dom.text).toContain('Página 2 de 3');
    dom.clickByText('button', 'Anterior');
    expect(service.search).toHaveBeenCalledWith({ applicationId: 'app-1', page: 0, size: 20 });
  });

  it('sends the text, type and status filters to the server', async () => {
    const dom = await create();
    dom.type('input[aria-label="Buscar por contenido"]', 'ana');
    dom.submit();
    expect(service.search.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ q: 'ana' }));
    dom.type('select[aria-label="Filtrar por tipo"]', 't2');
    expect(service.search.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ contactTypeId: 't2', q: 'ana' }));
    dom.type('select[aria-label="Filtrar por estado"]', 'false');
    expect(service.search.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ active: false }));
  });

  it('reloads when the application changes and asks to pick one when cleared', async () => {
    const dom = await create();
    dom.type('select[aria-label="Aplicación"]', 'app-2');
    expect(service.search.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ applicationId: 'app-2' }));
    service.search.calls.reset();
    dom.type('select[aria-label="Aplicación"]', '');
    expect(service.search).not.toHaveBeenCalled();
    expect(dom.text).toContain('Selecciona una aplicación');
  });

  it('filters by ids through the API and returns to the directory when cleared', async () => {
    const dom = await create();
    dom.type('input[aria-label="Filtrar por IDs"]', 'c2, c9');
    dom.submitByText('Buscar por IDs');
    expect(service.getByIds).toHaveBeenCalledWith(['c2', 'c9']);
    expect(dom.qa('tbody tr').length).toBe(1);

    service.search.calls.reset();
    dom.type('input[aria-label="Filtrar por IDs"]', '');
    dom.submitByText('Buscar por IDs');
    expect(service.search).toHaveBeenCalled();
  });

  it('lists the contacts of an external owner within the selected application', async () => {
    const dom = await create();
    const button = dom.qa('button').find((b) => b.textContent?.includes('Buscar por propietario')) as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
    dom.type('input[aria-label="Tipo de propietario"]', 'MERCHANT');
    dom.type('input[aria-label="ID del propietario"]', 'owner-1');
    dom.submitByText('Buscar por propietario');
    expect(service.getByOwner).toHaveBeenCalledWith('MERCHANT', 'owner-1', 'app-1');
    expect(dom.qa('tbody tr').length).toBe(1);

    service.search.calls.reset();
    dom.clickByText('button', 'Volver al directorio');
    expect(service.search).toHaveBeenCalled();
  });

  it('shows the empty state and works when contact types fail to load', async () => {
    const dom = await create(of(page([])), throwError(() => new Error('x')));
    expect(dom.text).toContain('No se encontraron contactos');
    expect(dom.qa('select[aria-label="Filtrar por tipo"] option').length).toBe(1);
  });

  it('reports load errors', async () => {
    const dom = await create(throwError(() => new Error('x')));
    expect(toast.error).toHaveBeenCalledWith('Error al cargar los contactos');
    expect(dom.text).not.toContain('Cargando');
  });
});
