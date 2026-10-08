import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { RoleService } from '@core/services/role.service';
import { ToastService } from '@core/services/toast.service';
import { UserService } from '@core/services/user.service';
import { UserTO } from '@shared/models/user.model';
import { UsersListComponent } from './users-list.component';

const user = (n: number, extra: Partial<UserTO> = {}): UserTO => ({
  id: `u${n}`,
  alias: `alias${n}`,
  email: `u${n}@x.com`,
  displayName: `Persona ${n}`,
  active: true,
  notificationEmail: false,
  notificationSms: false,
  privacyDataOutActive: false,
  ...extra,
});

const users: UserTO[] = [
  user(1, { roles: [{ id: 'r1', name: 'Admin', active: true }] }),
  user(2, { active: false }),
  ...Array.from({ length: 10 }, (_, i) => user(i + 3)),
];

describe('UsersListComponent', () => {
  let userService: jasmine.SpyObj<UserService>;
  let roleService: jasmine.SpyObj<RoleService>;
  let toast: jasmine.SpyObj<ToastService>;

  async function create(list: unknown = of(users)) {
    userService = jasmine.createSpyObj('UserService', ['getByApplication', 'delete', 'getByAlias', 'findAliasRecord']);
    roleService = jasmine.createSpyObj('RoleService', ['getByStatusAndIds']);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    userService.getByApplication.and.returnValue(list as never);
    userService.delete.and.returnValue(of(undefined));
    userService.getByAlias.and.returnValue(of(users[0]));
    userService.findAliasRecord.and.returnValue(of({ userId: 'u1', alias: 'alias1', roles: ['r1'] }));
    roleService.getByStatusAndIds.and.returnValue(of([{ id: 'r1', name: 'Admin', active: true }]));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: userService },
        { provide: RoleService, useValue: roleService },
        { provide: ToastService, useValue: toast },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ applicationId: 'a1' }) } } },
      ],
    });
    const fixture = TestBed.createComponent(UsersListComponent);
    fixture.detectChanges();
    const dom = new Dom(fixture);
    await dom.stable();
    return dom;
  }

  it('lists users with roles, paginated', async () => {
    const dom = await create();
    expect(userService.getByApplication).toHaveBeenCalledWith('a1');
    expect(dom.qa('tbody tr').length).toBe(10);
    expect(dom.text).toContain('Admin');
    expect(dom.text).toContain('1–10 de 12');
    dom.clickByText('button', 'Siguiente');
    expect(dom.text).toContain('11–12 de 12');
    dom.clickByText('button', 'Anterior');
    expect(dom.q('a[href="/applications/a1/users/u1/edit"]')).not.toBeNull();
  });

  it('filters by alias/name and status and changes the page size', async () => {
    const dom = await create();
    dom.type('input[placeholder^="Buscar por alias o"]', 'persona 2');
    expect(dom.qa('tbody tr').length).toBe(1);
    dom.type('input[placeholder^="Buscar por alias o"]', 'ALIAS1');
    expect(dom.qa('tbody tr').length).toBeGreaterThan(0);
    dom.type('input[placeholder^="Buscar por alias o"]', '');
    dom.type('select:nth-of-type(1)', 'inactive');
    expect(dom.qa('tbody tr').length).toBe(1);
    dom.type('select:nth-of-type(1)', 'active');
    expect(dom.qa('tbody tr').length).toBe(10);
    dom.pick('select:nth-of-type(2)', 1);
    expect(dom.qa('tbody tr').length).toBe(11);
  });

  it('shows empty state and reports load errors', async () => {
    expect((await create(of([]))).text).toContain('No se encontraron usuarios');
    TestBed.resetTestingModule();
    await create(throwError(() => new Error('x')));
    expect(toast.error).toHaveBeenCalledWith('Error al cargar los usuarios');
  });

  it('deletes a user after confirmation', async () => {
    const dom = await create();
    dom.click('button[title=Eliminar]');
    expect(dom.text).toContain('alias1');
    dom.clickByText('app-confirm-dialog button', 'Eliminar');
    expect(userService.delete).toHaveBeenCalledWith('a1', 'u1');
    expect(toast.success).toHaveBeenCalledWith('Usuario "alias1" eliminado correctamente');
    expect(dom.text).not.toContain('Persona 1 ');
  });

  it('cancels the deletion and reports delete errors', async () => {
    const dom = await create();
    dom.click('button[title=Eliminar]');
    dom.clickByText('app-confirm-dialog button', 'Cancelar');
    expect(userService.delete).not.toHaveBeenCalled();
    userService.delete.and.returnValue(throwError(() => new Error('x')));
    dom.click('button[title=Eliminar]');
    dom.clickByText('app-confirm-dialog button', 'Eliminar');
    expect(toast.error).toHaveBeenCalledWith('Error al eliminar el usuario');
    expect(dom.q('app-confirm-dialog')).toBeNull();
  });

  it('looks up an exact alias on the server and shows the resolved roles', async () => {
    const dom = await create();
    expect(dom.q<HTMLButtonElement>('form button[type=submit]')!.disabled).toBeTrue();
    dom.type('input[aria-label="Alias exacto"]', ' alias1 ');
    dom.submit();
    expect(userService.getByAlias).toHaveBeenCalledWith('alias1', 'a1');
    expect(userService.findAliasRecord).toHaveBeenCalledWith('alias1', 'a1');
    expect(roleService.getByStatusAndIds).toHaveBeenCalledWith(true, ['r1']);
    expect(dom.text).toContain('Persona 1');
    expect(dom.text).toContain('Admin');
    expect(dom.qa('a[href="/applications/a1/users/u1/edit"]').length).toBeGreaterThan(1);

    dom.clickByText('button', 'Limpiar');
    await dom.stable();
    expect(dom.q<HTMLInputElement>('input[aria-label="Alias exacto"]')!.value).toBe('');
    expect(dom.text).not.toContain('Sin roles');
  });

  it('handles alias records without roles and falls back to the user roles when role lookup fails', async () => {
    const dom = await create();
    userService.findAliasRecord.and.returnValue(of({ userId: 'u2', alias: 'alias2' }));
    userService.getByAlias.and.returnValue(of(users[1]));
    roleService.getByStatusAndIds.and.returnValue(of([]));
    dom.type('input[aria-label="Alias exacto"]', 'alias2');
    dom.submit();
    expect(dom.text).toContain('Sin roles');

    userService.findAliasRecord.and.returnValue(of({ userId: 'u1', alias: 'alias1', roles: ['r1'] }));
    userService.getByAlias.and.returnValue(of(users[0]));
    roleService.getByStatusAndIds.and.returnValue(throwError(() => new Error('x')));
    dom.type('input[aria-label="Alias exacto"]', 'alias1');
    dom.submit();
    expect(dom.text).toContain('Admin');
  });

  it('tells when the alias does not exist and reports other lookup errors', async () => {
    const dom = await create();
    userService.getByAlias.and.returnValue(throwError(() => ({ status: 404 })));
    dom.type('input[aria-label="Alias exacto"]', 'ghost');
    dom.submit();
    expect(dom.text).toContain('No se encontró un usuario con ese alias');

    userService.getByAlias.and.returnValue(throwError(() => ({ status: 500 })));
    dom.submit();
    expect(toast.error).toHaveBeenCalledWith('Error al buscar el alias');
    expect(dom.text).not.toContain('No se encontró un usuario con ese alias');
  });

  it('ignores empty alias lookups', async () => {
    const dom = await create();
    dom.submit();
    expect(userService.getByAlias).not.toHaveBeenCalled();
  });
});
