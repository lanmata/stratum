import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { FeatureService } from '@core/services/feature.service';
import { RoleService } from '@core/services/role.service';
import { ToastService } from '@core/services/toast.service';
import { Role } from '@shared/models/role.model';
import { RoleFormComponent } from './role-form.component';

const role: Role = {
  id: 'r1',
  name: 'Admin',
  description: 'Todo',
  active: true,
  features: [
    { id: 'f1', name: 'Crear', description: 'Alta', active: true },
    { id: 'f2', name: 'Borrar', active: true },
  ],
};

describe('RoleFormComponent', () => {
  let roles: jasmine.SpyObj<RoleService>;
  let features: jasmine.SpyObj<FeatureService>;
  let toast: jasmine.SpyObj<ToastService>;
  let router: Router;

  function create(roleId: string | null) {
    roles = jasmine.createSpyObj('RoleService', ['getById', 'create', 'update']);
    features = jasmine.createSpyObj('FeatureService', ['create', 'update']);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    roles.getById.and.returnValue(of(role));
    roles.create.and.returnValue(of(role));
    roles.update.and.returnValue(of(role));
    features.create.and.returnValue(of({ id: 'new', name: 'n', active: true }));
    features.update.and.returnValue(of({ id: 'f1', name: 'n', active: true }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: RoleService, useValue: roles },
        { provide: FeatureService, useValue: features },
        { provide: ToastService, useValue: toast },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ applicationId: 'a1', ...(roleId ? { roleId } : {}) }) } },
        },
      ],
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(RoleFormComponent);
    fixture.detectChanges();
    return new Dom(fixture);
  }

  const featureName = (dom: Dom<RoleFormComponent>, i: number) =>
    dom.qa<HTMLInputElement>('input[placeholder="Nombre *"]')[i];

  it('starts with one empty feature in create mode', () => {
    const dom = create(null);
    expect(dom.text).toContain('Funcionalidad 1');
    expect(roles.getById).not.toHaveBeenCalled();
    expect(dom.q<HTMLButtonElement>('button[title=Eliminar]')!.disabled).toBeTrue();
  });

  it('validates the role name and feature names before saving', () => {
    const dom = create(null);
    dom.clickByText('button', 'Crear rol');
    expect(roles.create).not.toHaveBeenCalled();
    expect(dom.text).toContain('obligatorio');
    expect(dom.text).toContain('El nombre de la funcionalidad es obligatorio');

    dom.type('input[formControlName=name]', 'Nuevo');
    dom.clickByText('button', 'Crear rol');
    expect(roles.create).not.toHaveBeenCalled();
  });

  it('creates a role with its inline features', () => {
    const dom = create(null);
    dom.type('input[formControlName=name]', 'Editor');
    dom.type('textarea[formControlName=description]', 'Edita');
    dom.type(featureName(dom, 0), '  Editar  ');
    dom.type('input[placeholder="Descripción (opcional)"]', ' Cambios ');
    dom.clickByText('button', 'Agregar funcionalidad');
    dom.type(featureName(dom, 1), 'Descartada');
    dom.click(dom.qa('button[title=Eliminar]')[1]);
    expect(dom.qa('input[placeholder="Nombre *"]').length).toBe(1);
    dom.clickByText('button', 'Agregar funcionalidad');
    dom.type(featureName(dom, 1), 'Ver');
    dom.clickByText('button', 'Crear rol');

    const req = roles.create.calls.mostRecent().args[0];
    expect(req.role.name).toBe('Editor');
    expect(req.role.applicationId).toBe('a1');
    expect(req.role.features).toEqual([
      { name: 'Editar', description: 'Cambios', active: true },
      { name: 'Ver', description: undefined, active: true },
    ]);
    expect(req.dateTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(toast.success).toHaveBeenCalledWith('Rol creado correctamente');
    expect(router.navigate).toHaveBeenCalledWith(['/applications', 'a1', 'roles']);
  });

  it('reports create errors', () => {
    const dom = create(null);
    roles.create.and.returnValue(throwError(() => new Error('x')));
    dom.type('input[formControlName=name]', 'Editor');
    dom.type(featureName(dom, 0), 'Ver');
    dom.clickByText('button', 'Crear rol');
    expect(toast.error).toHaveBeenCalledWith('Error al crear el rol');
    expect(dom.q<HTMLButtonElement>('button[type=button]:last-of-type')).toBeTruthy();
  });

  it('toggles the role and feature active switches', () => {
    const dom = create(null);
    const switches = dom.qa('button[role=switch]');
    expect(switches.length).toBeGreaterThan(1);
    dom.click(switches[switches.length - 1]);
    expect(dom.text).toContain('Inactiva');
    dom.click(dom.qa('button[role=switch]')[0]);
  });

  it('loads an existing role with its features', () => {
    const dom = create('r1');
    expect(roles.getById).toHaveBeenCalledWith('r1');
    expect(dom.q<HTMLInputElement>('input[formControlName=name]')!.value).toBe('Admin');
    expect(featureName(dom, 0).value).toBe('Crear');
    expect(featureName(dom, 1).value).toBe('Borrar');
    expect(dom.qa('button[title=Desactivar]').length).toBe(2);
  });

  it('keeps the default empty feature when the role has none', () => {
    const empty = create('r1');
    expect(empty).toBeTruthy();
    TestBed.resetTestingModule();
    roles = jasmine.createSpyObj('RoleService', ['getById']);
    roles.getById.and.returnValue(of({ ...role, features: [], description: undefined }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: RoleService, useValue: roles },
        { provide: FeatureService, useValue: jasmine.createSpyObj('FeatureService', ['create']) },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['error']) },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ applicationId: 'a1', roleId: 'r1' }) } } },
      ],
    });
    const fixture = TestBed.createComponent(RoleFormComponent);
    fixture.detectChanges();
    const dom = new Dom(fixture);
    expect(dom.qa('input[placeholder="Nombre *"]').length).toBe(1);
    expect(dom.q<HTMLTextAreaElement>('textarea[formControlName=description]')!.value).toBe('');
  });

  it('updates the role, then updates existing features and creates the new ones', () => {
    const dom = create('r1');
    dom.clickByText('button', 'Agregar funcionalidad');
    dom.type(featureName(dom, 2), 'Nueva');
    dom.type(featureName(dom, 0), 'Crear!');
    dom.clickByText('button', 'Guardar cambios');

    const [id, req] = roles.update.calls.mostRecent().args;
    expect(id).toBe('r1');
    expect(req.role).toEqual(jasmine.objectContaining({ id: 'r1', name: 'Admin', applicationId: 'a1' }));
    expect(features.update).toHaveBeenCalledTimes(2);
    expect(features.update.calls.first().args[0]).toBe('f1');
    expect(features.update.calls.first().args[1].feature).toEqual(jasmine.objectContaining({ id: 'f1', name: 'Crear!' }));
    expect(features.create).toHaveBeenCalledTimes(1);
    expect(features.create.calls.mostRecent().args[0].feature).toEqual(jasmine.objectContaining({ name: 'Nueva', roleIds: ['r1'] }));
    expect(toast.success).toHaveBeenCalledWith('Rol actualizado correctamente');
    expect(router.navigate).toHaveBeenCalledWith(['/applications', 'a1', 'roles']);
  });

  it('deactivates (never deletes) persisted features', () => {
    const dom = create('r1');
    dom.click('button[title=Desactivar]');
    expect(dom.qa('input[placeholder="Nombre *"]').length).toBe(2);
    const [first, second] = dom.qa<HTMLButtonElement>('button[title=Desactivar]');
    expect(first.disabled).toBeTrue();
    expect(second.disabled).toBeFalse();
    dom.clickByText('button', 'Guardar cambios');
    expect(features.update.calls.first().args[1].feature.active).toBeFalse();
  });

  it('refuses to remove the last remaining feature', () => {
    const dom = create(null);
    (dom.fixture.componentInstance as unknown as { removeFeature(i: number): void }).removeFeature(0);
    expect(dom.qa('input[placeholder="Nombre *"]').length).toBe(1);
  });

  it('reports role update errors', () => {
    const dom = create('r1');
    roles.update.and.returnValue(throwError(() => new Error('x')));
    dom.clickByText('button', 'Guardar cambios');
    expect(toast.error).toHaveBeenCalledWith('Error al actualizar el rol');
    expect(features.update).not.toHaveBeenCalled();
  });

  it('reports feature save errors after the role was saved', () => {
    const dom = create('r1');
    features.update.and.returnValue(throwError(() => new Error('x')));
    dom.clickByText('button', 'Guardar cambios');
    expect(toast.error).toHaveBeenCalledWith('El rol se guardó, pero hubo un error al guardar sus funcionalidades');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('goes back to the list when the role cannot be loaded', () => {
    roles = undefined as never;
    TestBed.resetTestingModule();
    const dom = (() => {
      roles = jasmine.createSpyObj('RoleService', ['getById']);
      features = jasmine.createSpyObj('FeatureService', ['create']);
      toast = jasmine.createSpyObj('ToastService', ['error']);
      roles.getById.and.returnValue(throwError(() => new Error('x')));
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          { provide: RoleService, useValue: roles },
          { provide: FeatureService, useValue: features },
          { provide: ToastService, useValue: toast },
          { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ applicationId: 'a1', roleId: 'r1' }) } } },
        ],
      });
      router = TestBed.inject(Router);
      spyOn(router, 'navigate').and.resolveTo(true);
      TestBed.createComponent(RoleFormComponent).detectChanges();
      return null;
    })();
    expect(dom).toBeNull();
    expect(toast.error).toHaveBeenCalledWith('Error al cargar el rol');
    expect(router.navigate).toHaveBeenCalledWith(['/applications', 'a1', 'roles']);
  });
});
