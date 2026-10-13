import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { FeatureService } from '@core/services/feature.service';
import { ToastService } from '@core/services/toast.service';
import { FeatureRoleLink, FeatureSummary } from '@shared/models/feature.model';
import { Page } from '@shared/models/page.model';
import { FeaturesListComponent } from './features-list.component';

function page<T>(content: T[], opts: Partial<Page<T>> = {}): Page<T> {
  return {
    content,
    page: 0,
    size: 10,
    totalElements: content.length,
    totalPages: 1,
    ...opts,
  };
}

const summaries: FeatureSummary[] = [
  { id: 'f1', name: 'USER_READ', description: 'Leer usuarios', active: true },
  { id: 'f2', name: 'USER_WRITE', active: false },
];

const links: FeatureRoleLink[] = [
  { roleId: 'r1', roleName: 'Admin', roleActive: true, applicationId: 'a1', applicationName: 'Comercios' },
  { roleId: 'r2', roleName: 'Soporte', roleActive: false, applicationId: 'a2', applicationName: 'Ventas' },
];

describe('FeaturesListComponent', () => {
  let service: jasmine.SpyObj<FeatureService>;
  let toast: jasmine.SpyObj<ToastService>;

  function create() {
    service = jasmine.createSpyObj('FeatureService', ['search', 'getRoles']);
    toast = jasmine.createSpyObj('ToastService', ['error']);
    service.search.and.returnValue(of(page(summaries)));
    service.getRoles.and.returnValue(of(page(links)));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: FeatureService, useValue: service },
        { provide: ToastService, useValue: toast },
      ],
    });
    const fixture = TestBed.createComponent(FeaturesListComponent);
    fixture.detectChanges();
    return new Dom(fixture);
  }

  function search(dom: Dom<FeaturesListComponent>, text: string) {
    dom.type('input[aria-label="Buscar funcionalidad"]', text);
    tick(300);
    dom.fixture.detectChanges();
  }

  it('does not load the catalog until something is searched', () => {
    const dom = create();
    expect(service.search).not.toHaveBeenCalled();
    expect(dom.text).toContain('Escribe al menos 2 caracteres');
    expect(dom.qa('tbody tr').length).toBe(0);
  });

  it('ignores queries shorter than two characters', fakeAsync(() => {
    const dom = create();
    search(dom, 'u');
    expect(service.search).not.toHaveBeenCalled();
    expect(dom.text).toContain('Escribe al menos 2 caracteres');
  }));

  it('searches server-side once the user stops typing, one page at a time', fakeAsync(() => {
    const dom = create();
    dom.type('input[aria-label="Buscar funcionalidad"]', 'us');
    dom.type('input[aria-label="Buscar funcionalidad"]', 'user');
    expect(service.search).not.toHaveBeenCalled();
    tick(300);
    dom.fixture.detectChanges();
    expect(service.search).toHaveBeenCalledTimes(1);
    expect(service.search).toHaveBeenCalledWith({ q: 'user', active: undefined, page: 0, size: 10 });
    expect(dom.qa('tbody tr').length).toBe(2);
    expect(dom.text).toContain('USER_READ');
    expect(dom.text).toContain('Inactiva');
    expect(dom.text).toContain('2 funcionalidades');
  }));

  it('filters by status and paginates the results', fakeAsync(() => {
    const dom = create();
    service.search.and.returnValue(of(page(summaries, { totalElements: 25, totalPages: 3 })));
    search(dom, 'user');
    dom.type('select[aria-label="Filtrar por estado"]', 'true');
    expect(service.search).toHaveBeenCalledWith({ q: 'user', active: true, page: 0, size: 10 });

    dom.clickByText('button', 'Siguiente');
    expect(service.search).toHaveBeenCalledWith({ q: 'user', active: true, page: 1, size: 10 });

    service.search.and.returnValue(of(page(summaries, { page: 2, totalElements: 25, totalPages: 3 })));
    dom.clickByText('button', 'Siguiente');
    expect(dom.text).toContain('Página 3 de 3');
    const calls = service.search.calls.count();
    dom.clickByText('button', 'Siguiente');
    expect(service.search.calls.count()).toBe(calls);
  }));

  it('clears the results when the query becomes too short', fakeAsync(() => {
    const dom = create();
    search(dom, 'user');
    dom.clickByText('button', 'Ver roles');
    search(dom, 'u');
    expect(dom.qa('tbody tr').length).toBe(0);
    expect(dom.q('section[aria-label="Roles vinculados"]')).toBeNull();
    expect(dom.text).toContain('Escribe al menos 2 caracteres');
  }));

  it('shows the roles, and applications, a feature is linked to, and closes the panel', fakeAsync(() => {
    const dom = create();
    search(dom, 'user');
    dom.clickByText('button', 'Ver roles');
    expect(service.getRoles).toHaveBeenCalledWith('f1', 0, 10);
    expect(dom.text).toContain('Roles que usan «USER_READ»');
    expect(dom.text).toContain('Admin');
    expect(dom.text).toContain('Comercios');
    expect(dom.text).toContain('Inactivo');
    const link = dom.q<HTMLAnchorElement>('section a')!;
    expect(link.getAttribute('href')).toBe('/applications/a1/roles/r1/edit');

    dom.clickByText('button', 'Cerrar');
    expect(dom.q('section[aria-label="Roles vinculados"]')).toBeNull();
  }));

  it('paginates the roles of a feature', fakeAsync(() => {
    const dom = create();
    service.getRoles.and.returnValue(of(page(links, { totalElements: 12, totalPages: 2 })));
    search(dom, 'user');
    dom.clickByText('button', 'Ver roles');
    service.getRoles.and.returnValue(of(page(links, { page: 1, totalElements: 12, totalPages: 2 })));
    dom.clickByText('section button', 'Siguiente');
    expect(service.getRoles).toHaveBeenCalledWith('f1', 1, 10);
    expect(dom.text).toContain('Página 2 de 2');
    const calls = service.getRoles.calls.count();
    dom.clickByText('section button', 'Siguiente');
    expect(service.getRoles.calls.count()).toBe(calls);
  }));

  it('explains when a feature is not linked to any role', fakeAsync(() => {
    const dom = create();
    service.getRoles.and.returnValue(of(page([])));
    search(dom, 'user');
    dom.clickByText('button', 'Ver roles');
    expect(dom.text).toContain('no está vinculada a ningún rol');
  }));

  it('shows the empty state', fakeAsync(() => {
    const dom = create();
    service.search.and.returnValue(of(page([])));
    search(dom, 'zzz');
    expect(dom.text).toContain('No se encontraron funcionalidades');
  }));

  it('reports search and role-loading errors', fakeAsync(() => {
    const dom = create();
    service.search.and.returnValue(throwError(() => new Error('x')));
    search(dom, 'user');
    expect(toast.error).toHaveBeenCalledWith('Error al buscar las funcionalidades');
    expect(dom.text).not.toContain('Cargando');

    service.search.and.returnValue(of(page(summaries)));
    search(dom, 'users');
    service.getRoles.and.returnValue(throwError(() => new Error('x')));
    dom.clickByText('button', 'Ver roles');
    expect(toast.error).toHaveBeenCalledWith('Error al cargar los roles de la funcionalidad');
  }));
});
