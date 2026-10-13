import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { FeatureService } from '@core/services/feature.service';
import { RoleService } from '@core/services/role.service';
import { ToastService } from '@core/services/toast.service';
import { Feature } from '@shared/models/feature.model';
import { FeaturesListComponent } from './features-list.component';

const features: Feature[] = [
  { id: 'feature-0001-aaaa', name: 'Crear usuarios', description: 'Alta', active: true },
  { id: 'feature-0002-bbbb', name: 'Borrar usuarios', active: false },
  ...Array.from({ length: 10 }, (_, i) => ({ id: `feature-x${i}-cccc`, name: `Extra ${i}`, active: true })),
];

describe('FeaturesListComponent', () => {
  let service: jasmine.SpyObj<FeatureService>;
  let roles: jasmine.SpyObj<RoleService>;
  let toast: jasmine.SpyObj<ToastService>;

  async function create(list: unknown = of(features), roleList: unknown = of([{ id: 'r1', name: 'Admin', active: true }])) {
    service = jasmine.createSpyObj('FeatureService', ['getAll', 'getByRole', 'getByStatusAndIds']);
    roles = jasmine.createSpyObj('RoleService', ['getAll']);
    toast = jasmine.createSpyObj('ToastService', ['error']);
    service.getAll.and.returnValue(list as never);
    service.getByRole.and.returnValue(of(features.slice(0, 2)));
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

  it('lists features including inactive ones, paginated', async () => {
    const dom = await create();
    expect(service.getAll).toHaveBeenCalledWith(true);
    expect(dom.qa('tbody tr').length).toBe(10);
    expect(dom.text).toContain('Crear usuarios');
    expect(dom.text).toContain('Inactiva');
    expect(dom.text).toContain('12 features');
    dom.clickByText('button', 'Siguiente');
    expect(dom.text).toContain('Página 2 de 2');
    dom.clickByText('button', 'Anterior');
    expect(dom.text).toContain('Página 1 de 2');
  });

  it('filters by name client-side', async () => {
    const dom = await create();
    dom.type('input[aria-label="Buscar por nombre"]', 'borrar');
    expect(dom.qa('tbody tr').length).toBe(1);
  });

  it('reloads only active features when inactive ones are excluded', async () => {
    const dom = await create();
    dom.check('input[type=checkbox]', false);
    expect(service.getAll).toHaveBeenCalledWith(false);
  });

  it('filters by role, hiding inactive features when excluded', async () => {
    const dom = await create();
    dom.type('select[aria-label="Filtrar por rol"]', 'r1');
    expect(service.getByRole).toHaveBeenCalledWith('r1');
    expect(dom.qa('tbody tr').length).toBe(2);

    dom.check('input[type=checkbox]', false);
    expect(dom.qa('tbody tr').length).toBe(1);
    expect(dom.text).not.toContain('Borrar usuarios');
  });

  it('filters by ids, taking precedence over the role', async () => {
    const dom = await create();
    dom.type('select[aria-label="Filtrar por rol"]', 'r1');
    dom.type('input[aria-label="Filtrar por IDs"]', 'a, b');
    dom.submit();
    expect(service.getByStatusAndIds).toHaveBeenCalledWith(true, ['a', 'b']);
    expect(dom.qa('tbody tr').length).toBe(1);
  });

  it('shows the empty state and tolerates a failing role list', async () => {
    const dom = await create(of([]), throwError(() => new Error('x')));
    expect(dom.text).toContain('No se encontraron features');
  });

  it('reports load errors', async () => {
    const dom = await create(throwError(() => new Error('x')));
    expect(toast.error).toHaveBeenCalledWith('Error al cargar las features');
    expect(dom.text).not.toContain('Cargando');
  });
});
