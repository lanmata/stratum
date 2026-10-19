import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { RoleService } from '@core/services/role.service';
import { Role } from '@shared/models/role.model';
import { RolesListComponent } from './roles-list.component';

const feature = (n: number, active = true) => ({ id: `f${n}`, name: `Feature ${n}`, active });
const roles: Role[] = [
  { id: 'r1', name: 'Admin', description: 'Todo', active: true, features: [feature(1), feature(2, false)] },
  { id: 'r2', name: 'Lector', active: false },
  ...Array.from({ length: 10 }, (_, i) => ({ id: `x${i}`, name: `Extra ${i}`, active: true })),
];

describe('RolesListComponent', () => {
  let service: jasmine.SpyObj<RoleService>;

  async function create(own: unknown = of(roles)) {
    service = jasmine.createSpyObj('RoleService', ['getByApplication', 'getByStatus', 'getByStatusAndIds']);
    service.getByApplication.and.returnValue(own as never);
    service.getByStatus.and.returnValue(of(roles.filter((r) => r.active)));
    service.getByStatusAndIds.and.returnValue(of([roles[0], { id: 'other-app', name: 'Foreign', active: true }]));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: RoleService, useValue: service },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ applicationId: 'a1' }) } } },
      ],
    });
    const fixture = TestBed.createComponent(RolesListComponent);
    fixture.detectChanges();
    const dom = new Dom(fixture);
    await dom.stable();
    return dom;
  }

  it('lists the roles of the application, paginated', async () => {
    const dom = await create();
    expect(service.getByApplication).toHaveBeenCalledWith('a1');
    expect(dom.qa('tbody tr').length).toBe(10);
    expect(dom.text).toContain('1–10 de 12');
    dom.clickByText('button', 'Siguiente');
    expect(dom.text).toContain('11–12 de 12');
    dom.clickByText('button', 'Anterior');
    expect(dom.q('a[href="/applications/a1/roles/new"]')).not.toBeNull();
    expect(dom.q('a[href="/applications/a1/roles/r1/edit"]')).not.toBeNull();
  });

  it('expands a role to show its features and collapses it again', async () => {
    const dom = await create();
    expect(dom.text).not.toContain('Feature 1');
    dom.click('tbody tr');
    expect(dom.text).toContain('Feature 1');
    expect(dom.text).toContain('Feature 2');
    dom.click('tbody tr');
    expect(dom.text).not.toContain('Feature 1');
  });

  it('filters by name and status and changes the page size', async () => {
    const dom = await create();
    dom.type('input[placeholder^="Buscar"]', 'lect');
    expect(dom.qa('tbody tr').length).toBe(1);
    dom.type('input[placeholder^="Buscar"]', '');
    dom.type('select:nth-of-type(1)', 'inactive');
    expect(dom.text).toContain('Lector');
    expect(dom.qa('tbody tr').length).toBe(1);
    dom.type('select:nth-of-type(1)', 'active');
    expect(dom.qa('tbody tr').length).toBe(10);
    dom.pick('select:nth-of-type(2)', 1);
    expect(dom.qa('tbody tr').length).toBe(11);
  });

  it('shows only active roles when inactive ones are excluded, limited to this application', async () => {
    const dom = await create();
    dom.check('input[type=checkbox]', false);
    expect(service.getByStatus).toHaveBeenCalledWith(false);
    expect(dom.text).not.toContain('Lector');
    expect(dom.text).toContain('Admin');

    dom.check('input[type=checkbox]', true);
    expect(dom.text).toContain('Lector');
  });

  it('filters by ids keeping only roles of this application', async () => {
    const dom = await create();
    dom.type('input[aria-label="Filtrar por IDs"]', 'r1,other-app');
    dom.submit();
    expect(service.getByStatusAndIds).toHaveBeenCalledWith(true, ['r1', 'other-app']);
    expect(dom.text).toContain('Admin');
    expect(dom.text).not.toContain('Foreign');
  });

  it('combines the ids filter with excluding inactive roles', async () => {
    const dom = await create();
    dom.check('input[type=checkbox]', false);
    dom.type('input[aria-label="Filtrar por IDs"]', 'r1');
    dom.submit();
    expect(service.getByStatusAndIds).toHaveBeenCalledWith(false, ['r1']);
  });

  it('shows the empty state and stops loading on error', async () => {
    expect((await create(of([]))).text).toContain('No se encontraron roles');
    TestBed.resetTestingModule();
    expect((await create(throwError(() => new Error('x')))).text).not.toContain('Cargando');
  });
});
