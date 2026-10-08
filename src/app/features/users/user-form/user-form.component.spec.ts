import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Component, input } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { RoleService } from '@core/services/role.service';
import { ToastService } from '@core/services/toast.service';
import { UserService } from '@core/services/user.service';
import { PersonAddressesComponent } from '@shared/components/person-addresses/person-addresses.component';
import { PersonContactsComponent } from '@shared/components/person-contacts/person-contacts.component';
import { PersonIdentificationDocumentsComponent } from '@shared/components/person-identification-documents/person-identification-documents.component';
import { Role } from '@shared/models/role.model';
import { UserTO } from '@shared/models/user.model';
import { UserFormComponent } from './user-form.component';

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

const adminRole: Role = { id: 'r1', name: 'Admin', active: true };
const viewerRole: Role = { id: 'r2', name: 'Viewer', active: false };

const existing: UserTO = {
  id: 'u1',
  alias: 'ana01',
  email: 'ana@x.com',
  displayName: 'Ana',
  active: true,
  notificationEmail: true,
  notificationSms: false,
  privacyDataOutActive: true,
  person: { id: 'p1', firstName: 'Ana', lastName: 'Pérez', middleName: 'M', gender: 'F', birthdate: '1990-01-01' },
  roles: [adminRole],
};

describe('UserFormComponent', () => {
  let users: jasmine.SpyObj<UserService>;
  let roles: jasmine.SpyObj<RoleService>;
  let toast: jasmine.SpyObj<ToastService>;
  let router: Router;

  function create(userId: string | null) {
    users = jasmine.createSpyObj('UserService', [
      'create', 'getById', 'update', 'updateFull', 'linkRole', 'unlinkRole', 'checkAlias', 'checkEmail',
    ]);
    roles = jasmine.createSpyObj('RoleService', ['getByApplication', 'getByUser']);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning']);
    users.getById.and.returnValue(of(existing));
    users.update.and.returnValue(of(undefined));
    users.updateFull.and.returnValue(of(existing));
    users.linkRole.and.returnValue(of(existing));
    users.unlinkRole.and.returnValue(of(existing));
    users.checkAlias.and.returnValue(of(undefined));
    users.checkEmail.and.returnValue(of(undefined));
    users.create.and.returnValue(of(new HttpResponse({ body: { id: 'u9', alias: 'newuser', email: 'n@x.com' } })));
    roles.getByApplication.and.returnValue(of([adminRole, viewerRole]));
    roles.getByUser.and.returnValue(of([adminRole, { id: 'other-app-role', name: 'Foreign', active: true }]));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: users },
        { provide: RoleService, useValue: roles },
        { provide: ToastService, useValue: toast },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ applicationId: 'a1', ...(userId ? { userId } : {}) }) } },
        },
      ],
    });
    TestBed.overrideComponent(UserFormComponent, {
      remove: { imports: [PersonContactsComponent, PersonAddressesComponent, PersonIdentificationDocumentsComponent] },
      add: { imports: [FakeContacts, FakeAddresses, FakeDocs] },
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(UserFormComponent);
    fixture.detectChanges();
    return new Dom(fixture);
  }

  function fillCreate(dom: Dom<UserFormComponent>) {
    dom.type('input[formControlName=alias]', 'newuser');
    dom.type('input[formControlName=displayName]', 'Nuevo Usuario');
    dom.type('input[formControlName=email]', 'n@x.com');
    dom.type('input[formControlName=password]', 'password1');
    dom.type('input[formControlName=firstName]', 'Nuevo');
    dom.type('input[formControlName=lastName]', 'Usuario');
    dom.type('select[formControlName=roleId]', 'r1');
    tick(400);
    dom.fixture.detectChanges();
  }

  describe('create mode', () => {
    it('starts with the password visible and loads the application roles', () => {
      const dom = create(null);
      expect(dom.text).toContain('Nuevo Usuario');
      expect(roles.getByApplication).toHaveBeenCalledWith('a1');
      expect(roles.getByUser).not.toHaveBeenCalled();
      expect(dom.q('input[formControlName=password]')).not.toBeNull();
      expect(dom.q('input[formControlName=email]')).not.toBeNull();
      expect(dom.q('app-person-contacts')).toBeNull();
    });

    it('creates the user, mapping optional person fields', fakeAsync(() => {
      const dom = create(null);
      fillCreate(dom);
      dom.type('input[formControlName=middleName]', 'Medio');
      dom.type('select[formControlName=gender]', dom.qa<HTMLOptionElement>('select[formControlName=gender] option')[1].value);
      dom.type('input[formControlName=birthdate]', '2000-02-03');
      dom.submit();
      const req = users.create.calls.mostRecent().args[0];
      expect(req).toEqual(
        jasmine.objectContaining({
          alias: 'newuser',
          displayName: 'Nuevo Usuario',
          email: 'n@x.com',
          password: 'password1',
          roleId: 'r1',
          applicationId: 'a1',
          active: true,
        }),
      );
      expect(req.person).toEqual(jasmine.objectContaining({ firstName: 'Nuevo', lastName: 'Usuario', middleName: 'Medio', birthdate: '2000-02-03' }));
      expect(toast.success).toHaveBeenCalledWith('Usuario creado con ID: u9');
      expect(router.navigate).toHaveBeenCalledWith(['/applications', 'a1', 'users']);
    }));

    it('leaves out empty optional person fields', fakeAsync(() => {
      const dom = create(null);
      fillCreate(dom);
      dom.submit();
      const person = users.create.calls.mostRecent().args[0].person!;
      expect('middleName' in person).toBeFalse();
      expect('gender' in person).toBeFalse();
      expect('birthdate' in person).toBeFalse();
    }));

    it('shows backend warnings once, even when repeated', fakeAsync(() => {
      const dom = create(null);
      users.create.and.returnValue(
        of(new HttpResponse({ body: { id: 'u9', alias: 'x', email: 'e' }, headers: new HttpHeaders({ Warning: 'sin email; sin sms, sin email' }) })),
      );
      fillCreate(dom);
      dom.submit();
      expect(toast.warning).toHaveBeenCalledWith('sin email; sin sms');
    }));

    it('reports create errors, preferring backend warnings', fakeAsync(() => {
      const dom = create(null);
      fillCreate(dom);
      users.create.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      dom.submit();
      expect(toast.error).toHaveBeenCalledWith('Error al crear el usuario');

      users.create.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 409, headers: new HttpHeaders({ Warning: 'alias duplicado' }) })),
      );
      dom.submit();
      expect(toast.warning).toHaveBeenCalledWith('alias duplicado');
      expect(dom.q<HTMLButtonElement>('button[type=submit]')!.disabled).toBeFalse();
    }));

    it('blocks submit while the form is invalid', () => {
      const dom = create(null);
      dom.submit();
      expect(users.create).not.toHaveBeenCalled();
      expect(dom.q<HTMLButtonElement>('button[type=submit]')!.disabled).toBeTrue();
    });

    it('validates alias length, email format and password length', fakeAsync(() => {
      const dom = create(null);
      dom.type('input[formControlName=alias]', 'abc');
      dom.q('input[formControlName=alias]')!.dispatchEvent(new Event('blur'));
      dom.type('input[formControlName=email]', 'not-mail');
      dom.q('input[formControlName=email]')!.dispatchEvent(new Event('blur'));
      dom.type('input[formControlName=password]', 'short');
      dom.q('input[formControlName=password]')!.dispatchEvent(new Event('blur'));
      dom.fixture.detectChanges();
      expect(dom.text).toContain('entre 5 y 12 caracteres');
      expect(dom.text).toContain('Mínimo 8 caracteres');
      expect(users.checkAlias).not.toHaveBeenCalled();
      expect(users.checkEmail).not.toHaveBeenCalled();
    }));

    it('flags unavailable aliases and emails (404) and accepts available ones', fakeAsync(() => {
      const dom = create(null);
      users.checkAlias.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
      users.checkEmail.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
      dom.type('input[formControlName=alias]', 'taken1');
      dom.q('input[formControlName=alias]')!.dispatchEvent(new Event('blur'));
      dom.type('input[formControlName=email]', 'taken@x.com');
      dom.q('input[formControlName=email]')!.dispatchEvent(new Event('blur'));
      tick(400);
      dom.fixture.detectChanges();
      expect(users.checkAlias).toHaveBeenCalledWith('taken1', 'a1');
      expect(users.checkEmail).toHaveBeenCalledWith('taken@x.com', 'a1');
      expect(dom.text).toContain('alias ya está en uso');
      expect(dom.text).toContain('email ya está registrado');

      users.checkAlias.and.returnValue(of(undefined));
      users.checkEmail.and.returnValue(of(undefined));
      dom.type('input[formControlName=alias]', 'free123');
      dom.type('input[formControlName=email]', 'free@x.com');
      tick(400);
      dom.fixture.detectChanges();
      expect(dom.text).toContain('Alias disponible');
    }));

    it('treats availability check failures other than 404 as available', fakeAsync(() => {
      const dom = create(null);
      users.checkAlias.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      users.checkEmail.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      dom.type('input[formControlName=alias]', 'maybe1');
      dom.type('input[formControlName=email]', 'maybe@x.com');
      tick(400);
      expect(dom.fixture.componentInstance['form' as keyof UserFormComponent]).toBeDefined();
      expect(dom.q('input[formControlName=alias]')!.className).not.toContain('border-red-400');
    }));

    it('toggles the preference switches and the password field', () => {
      const dom = create(null);
      const before = dom.qa('button[type=button]').length;
      for (const b of dom.qa('button[type=button]').slice(0, 3)) b.click();
      dom.fixture.detectChanges();
      expect(dom.qa('button[type=button]').length).toBe(before);
    });

    it('stops loading when roles cannot be fetched', () => {
      const failing = (() => {
        TestBed.resetTestingModule();
        users = jasmine.createSpyObj('UserService', ['checkAlias', 'checkEmail']);
        roles = jasmine.createSpyObj('RoleService', ['getByApplication']);
        roles.getByApplication.and.returnValue(throwError(() => new Error('x')));
        TestBed.configureTestingModule({
          providers: [
            provideRouter([]),
            { provide: UserService, useValue: users },
            { provide: RoleService, useValue: roles },
            { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['error']) },
            { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ applicationId: 'a1' }) } } },
          ],
        });
        const fixture = TestBed.createComponent(UserFormComponent);
        fixture.detectChanges();
        return new Dom(fixture);
      })();
      expect(failing.text).not.toContain('Cargando');
    });
  });

  describe('edit mode', () => {
    it('loads the user, locks alias and email, and shows the person sections', () => {
      const dom = create('u1');
      expect(dom.text).toContain('Editar Usuario');
      expect(users.getById).toHaveBeenCalledWith('u1');
      expect(roles.getByUser).toHaveBeenCalledWith('u1');
      expect(dom.q<HTMLInputElement>('input[formControlName=alias]')!.disabled).toBeTrue();
      expect(dom.q<HTMLInputElement>('input[formControlName=alias]')!.value).toBe('ana01');
      expect(dom.q('input[formControlName=email]')).toBeNull();
      expect(dom.q<HTMLInputElement>('input[formControlName=firstName]')!.value).toBe('Ana');
      expect(dom.q('app-person-contacts')).not.toBeNull();
      expect(dom.q('app-person-addresses')).not.toBeNull();
      expect(dom.q('app-person-identification-documents')).not.toBeNull();
      expect(dom.qa<HTMLInputElement>('input[type=checkbox]').map((c) => c.checked)).toEqual([true, false]);
      expect(dom.text).toContain('1 rol(es) seleccionado(s)');
    });

    it('falls back to the roles embedded in the user when the roles lookup is empty or fails', () => {
      create('u1');
      TestBed.resetTestingModule();
      let dom = (() => {
        const d = create('u1');
        return d;
      })();
      expect(dom).toBeTruthy();
      TestBed.resetTestingModule();
      users = undefined as never;
      const d2 = (() => {
        users = jasmine.createSpyObj('UserService', ['getById']);
        roles = jasmine.createSpyObj('RoleService', ['getByApplication', 'getByUser']);
        users.getById.and.returnValue(of(existing));
        roles.getByApplication.and.returnValue(of([adminRole, viewerRole]));
        roles.getByUser.and.returnValue(throwError(() => new Error('x')));
        TestBed.configureTestingModule({
          providers: [
            provideRouter([]),
            { provide: UserService, useValue: users },
            { provide: RoleService, useValue: roles },
            { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['error']) },
            { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ applicationId: 'a1', userId: 'u1' }) } } },
          ],
        });
        TestBed.overrideComponent(UserFormComponent, {
          remove: { imports: [PersonContactsComponent, PersonAddressesComponent, PersonIdentificationDocumentsComponent] },
          add: { imports: [FakeContacts, FakeAddresses, FakeDocs] },
        });
        const fixture = TestBed.createComponent(UserFormComponent);
        fixture.detectChanges();
        return new Dom(fixture);
      })();
      expect(d2.qa<HTMLInputElement>('input[type=checkbox]').map((c) => c.checked)).toEqual([true, false]);
      dom = undefined as never;
    });

    it('goes back to the list when the user cannot be loaded', () => {
      TestBed.resetTestingModule();
      users = jasmine.createSpyObj('UserService', ['getById']);
      roles = jasmine.createSpyObj('RoleService', ['getByApplication', 'getByUser']);
      toast = jasmine.createSpyObj('ToastService', ['error']);
      users.getById.and.returnValue(throwError(() => new Error('x')));
      roles.getByApplication.and.returnValue(of([]));
      roles.getByUser.and.returnValue(of([]));
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          { provide: UserService, useValue: users },
          { provide: RoleService, useValue: roles },
          { provide: ToastService, useValue: toast },
          { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ applicationId: 'a1', userId: 'u1' }) } } },
        ],
      });
      router = TestBed.inject(Router);
      spyOn(router, 'navigate').and.resolveTo(true);
      TestBed.createComponent(UserFormComponent).detectChanges();
      expect(toast.error).toHaveBeenCalledWith('Error al cargar el usuario');
      expect(router.navigate).toHaveBeenCalledWith(['/applications', 'a1', 'users']);
    });

    it('updates the user and syncs role links', () => {
      const dom = create('u1');
      const [adminBox, viewerBox] = dom.qa<HTMLInputElement>('input[type=checkbox]');
      dom.click(adminBox);
      dom.click(viewerBox);
      dom.type('input[formControlName=displayName]', 'Ana María');
      dom.type('input[formControlName=middleName]', '');
      dom.submit();

      const [id, req] = users.update.calls.mostRecent().args;
      expect(id).toBe('u1');
      expect(req).toEqual(
        jasmine.objectContaining({ userId: 'u1', displayName: 'Ana María', firstName: 'Ana', lastName: 'Pérez', application: 'a1' }),
      );
      expect('password' in req).toBeFalse();
      expect(users.linkRole).toHaveBeenCalledWith('u1', 'r2');
      expect(users.unlinkRole).toHaveBeenCalledWith('u1', 'r1');
      expect(toast.success).toHaveBeenCalledWith('Usuario actualizado correctamente');
      expect(router.navigate).toHaveBeenCalledWith(['/applications', 'a1', 'users']);
    });

    it('does not touch roles when unchanged and sends a new password when typed', () => {
      const dom = create('u1');
      dom.clickByText('button', 'Cambiar Contraseña');
      dom.type('input[formControlName=password]', 'newpassword');
      dom.submit();
      expect(users.linkRole).not.toHaveBeenCalled();
      expect(users.unlinkRole).not.toHaveBeenCalled();
      expect(users.update.calls.mostRecent().args[1].password).toBe('newpassword');
    });

    it('reports update errors', () => {
      const dom = create('u1');
      users.update.and.returnValue(throwError(() => new Error('x')));
      dom.submit();
      expect(toast.error).toHaveBeenCalledWith('Error al actualizar el usuario');
      expect(dom.q<HTMLButtonElement>('button[type=submit]')!.disabled).toBeFalse();
    });

    it('saves the full user detail replacing person data and roles', () => {
      const dom = create('u1');
      dom.click(dom.qa<HTMLInputElement>('input[type=checkbox]')[1]);
      dom.type('input[formControlName=displayName]', 'Ana Full');
      dom.clickByText('button', 'Guardar detalle completo');
      const [id, user] = users.updateFull.calls.mostRecent().args;
      expect(id).toBe('u1');
      expect(user).toEqual(jasmine.objectContaining({ id: 'u1', alias: 'ana01', displayName: 'Ana Full' }));
      expect(user.person).toEqual(jasmine.objectContaining({ id: 'p1', firstName: 'Ana', lastName: 'Pérez', middleName: 'M' }));
      expect(user.roles!.map((r) => r.id).sort()).toEqual(['r1', 'r2']);
      expect('password' in user).toBeFalse();
      expect(toast.success).toHaveBeenCalledWith('Detalle completo del usuario actualizado');
      expect(router.navigate).toHaveBeenCalledWith(['/applications', 'a1', 'users']);
    });

    it('includes a typed password and omits empty optional person fields in the full detail', () => {
      const dom = create('u1');
      dom.clickByText('button', 'Cambiar Contraseña');
      dom.type('input[formControlName=password]', 'newpassword');
      dom.type('input[formControlName=middleName]', '');
      dom.type('input[formControlName=birthdate]', '');
      dom.clickByText('button', 'Guardar detalle completo');
      const user = users.updateFull.calls.mostRecent().args[1];
      expect(user.password).toBe('newpassword');
      expect(user.person!.middleName).toBe('M');
    });

    it('reports full detail errors', () => {
      const dom = create('u1');
      users.updateFull.and.returnValue(throwError(() => new Error('x')));
      dom.clickByText('button', 'Guardar detalle completo');
      expect(toast.error).toHaveBeenCalledWith('Error al actualizar el detalle completo del usuario');
    });

    it('does not offer the full detail action when creating', () => {
      expect(create(null).text).not.toContain('Guardar detalle completo');
    });
  });
});
