import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { FeatureService } from '@core/services/feature.service';
import { RoleService } from '@core/services/role.service';
import { ToastService } from '@core/services/toast.service';
import { FeatureRoleLink, FeatureSummary } from '@shared/models/feature.model';
import { PageResponse } from '@shared/models/page.model';
import { FeaturesListComponent } from './features-list.component';

const features: FeatureSummary[] = [
  { id: 'feature-0001-aaaa', name: 'Crear usuarios', description: 'Alta', active: true },
  { id: 'feature-0002-bbbb', name: 'Borrar usuarios', active: false },
];
const link: FeatureRoleLink = {
  roleId: 'r1',
  roleName: 'Admin',
  roleActive: true,
  applicationId: 'a1',
  applicationName: 'shop-index',
};

function page<T>(content: T[], pageIndex = 0, totalPages = 1, totalElements = content.length): PageResponse<T> {
  return { content, page: pageIndex, size: 20, totalElements, totalPages };
}

describe('FeaturesListComponent', () => {
  let service: jasmine.SpyObj<FeatureService>;
  let roles: jasmine.SpyObj<RoleService>;
  let toast: jasmine.SpyObj<ToastService>;

  async function create(first: unknown = of(page(features)), roleList: unknown = of([{ id: 'r1', name: 'Admin', active: true }])) {
    service = jasmine.createSpyObj('FeatureService', ['search', 'getRoles', 'getByRole', 'getByStatusAndIds']);
    roles = jasmine.createSpyObj('RoleService', ['getAll']);
    toast = jasmine.createSpyObj('ToastService', ['error']);
    service.search.and.returnValue(first as never);
    service.getRoles.and.returnValue(of(page([link])));
    service.getByRole.and.returnValue(of(features));
    service.getByStatusAndIds.and.returnValue(of([features[0]]));
    roles.getAll.and.returnValue(roleList as never);
    TestBed.configureTestingModule({
      providers: [
        { provide: FeatureService, useValue: service },
        { provide: RoleService, useValue: roles },
        { provide: ToastService, useValue: toast },
      ],
    });
    const fixture = TestBed.createComponent(FeaturesListComponent);
    fixture.detectChanges();
    const dom = new Dom(fixture);
    await dom.stable();
    return dom;
  }

  it('loads the first catalog page from the server, including inactive features', async () => {
    const dom = await create();
    expect(service.search).toHaveBeenCalledWith({ page: 0, size: 20 });
    expect(dom.qa('tbody tr').length).toBe(2);
    expect(dom.text).toContain('Crear usuarios');
    expect(dom.text).toContain('Inactiva');
    expect(dom.text).toContain('2 features');
  });

  it('pages through the server', async () => {
    const dom = await create(of(page(features, 0, 3, 41)));
    expect(dom.text).toContain('Página 1 de 3');
    service.search.and.returnValue(of(page([features[1]], 1, 3, 41)));
    dom.clickByText('button', 'Siguiente');
    expect(service.search).toHaveBeenCalledWith({ page: 1, size: 20 });
    expect(dom.text).toContain('Página 2 de 3');
    dom.clickByText('button', 'Anterior');
    expect(service.search).toHaveBeenCalledWith({ page: 0, size: 20 });
  });

  it('sends the text and status filters to the server', async () => {
    const dom = await create();
    dom.type('input[aria-label="Buscar por nombre"]', ' crear ');
    dom.submit();
    expect(service.search.calls.mostRecent().args[0]).toEqual({ page: 0, size: 20, q: 'crear' });
    dom.type('select[aria-label="Filtrar por estado"]', 'false');
    expect(service.search.calls.mostRecent().args[0]).toEqual({ page: 0, size: 20, q: 'crear', active: false });
  });

  it('filters by role and applies the status and text locally on that bounded list', async () => {
    const dom = await create();
    dom.type('select[aria-label="Filtrar por rol"]', 'r1');
    expect(service.getByRole).toHaveBeenCalledWith('r1');
    expect(dom.qa('tbody tr').length).toBe(2);
    dom.type('select[aria-label="Filtrar por estado"]', 'true');
    expect(dom.qa('tbody tr').length).toBe(1);
    dom.type('input[aria-label="Buscar por nombre"]', 'zzz');
    dom.submit();
    expect(dom.text).toContain('No se encontraron features');
  });

  it('filters by ids through the API', async () => {
    const dom = await create();
    dom.type('input[aria-label="Filtrar por IDs"]', 'feature-0001-aaaa, x');
    dom.submitByText('Buscar por IDs');
    expect(service.getByStatusAndIds).toHaveBeenCalledWith(true, ['feature-0001-aaaa', 'x']);
    expect(dom.qa('tbody tr').length).toBe(1);

    service.search.calls.reset();
    dom.type('input[aria-label="Filtrar por IDs"]', '');
    dom.submitByText('Buscar por IDs');
    expect(service.search).toHaveBeenCalled();
  });

  it('shows the roles, with their application, that use a feature', async () => {
    const dom = await create();
    dom.clickByText('button', 'Ver roles');
    expect(service.getRoles).toHaveBeenCalledWith('feature-0001-aaaa', 0, 10);
    expect(dom.text).toContain('Admin');
    expect(dom.text).toContain('shop-index');
    dom.clickByText('button', 'Ocultar roles');
    expect(dom.text).not.toContain('shop-index');
  });

  it('pages the roles of a feature and flags inactive ones', async () => {
    const dom = await create();
    service.getRoles.and.returnValue(of(page([{ ...link, roleActive: false }], 0, 2, 11)));
    dom.clickByText('button', 'Ver roles');
    expect(dom.text).toContain('Inactivo');
    expect(dom.text).toContain('1 / 2');
    service.getRoles.and.returnValue(of(page([link], 1, 2, 11)));
    dom.clickByText('button', 'Roles siguientes');
    expect(service.getRoles).toHaveBeenCalledWith('feature-0001-aaaa', 1, 10);
    dom.clickByText('button', 'Roles anteriores');
    expect(service.getRoles).toHaveBeenCalledWith('feature-0001-aaaa', 0, 10);
  });

  it('says so when no role uses the feature and reports role load errors', async () => {
    const dom = await create();
    service.getRoles.and.returnValue(of(page([])));
    dom.clickByText('button', 'Ver roles');
    expect(dom.text).toContain('Ningún rol usa esta feature');
    dom.clickByText('button', 'Ocultar roles');
    service.getRoles.and.returnValue(throwError(() => new Error('x')));
    dom.clickByText('button', 'Ver roles');
    expect(toast.error).toHaveBeenCalledWith('Error al cargar los roles de la feature');
  });

  it('shows the empty state and works when roles fail to load', async () => {
    const dom = await create(of(page([])), throwError(() => new Error('x')));
    expect(dom.text).toContain('No se encontraron features');
    expect(dom.qa('select[aria-label="Filtrar por rol"] option').length).toBe(1);
  });

  it('reports load errors', async () => {
    const dom = await create(throwError(() => new Error('x')));
    expect(toast.error).toHaveBeenCalledWith('Error al cargar las features');
    expect(dom.text).not.toContain('Cargando');
  });
});
