import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { ManagedClientService } from '@core/services/managed-client.service';
import { ToastService } from '@core/services/toast.service';
import { ManagedClientTO } from '@shared/models/managed-client.model';
import { ApplicationManagedClientsComponent } from './application-managed-clients.component';

const client: ManagedClientTO = {
  clientId: 'c1',
  name: 'Backend',
  description: 'Servicio',
  applicationId: 'a1',
  scopes: ['read', 'write'],
  active: true,
  createdAt: '2026-01-01',
  secretLastRotatedAt: '2026-02-01',
};

describe('ApplicationManagedClientsComponent', () => {
  let service: jasmine.SpyObj<ManagedClientService>;
  let toast: jasmine.SpyObj<ToastService>;

  function create(list: ManagedClientTO[] = [client]) {
    service = jasmine.createSpyObj('ManagedClientService', [
      'list', 'create', 'update', 'delete', 'rotateSecret', 'revokeAllTokens', 'issueToken', 'introspectToken',
    ]);
    service.list.and.returnValue(of(list));
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    TestBed.configureTestingModule({
      providers: [
        { provide: ManagedClientService, useValue: service },
        { provide: ToastService, useValue: toast },
        { provide: ActivatedRoute, useValue: { parent: { snapshot: { paramMap: convertToParamMap({ applicationId: 'a1' }) } } } },
      ],
    });
    const fixture = TestBed.createComponent(ApplicationManagedClientsComponent);
    fixture.detectChanges();
    return new Dom(fixture);
  }

  it('lists the clients of the application with their scopes and the token tools', () => {
    const dom = create();
    expect(service.list).toHaveBeenCalledWith('a1');
    expect(dom.text).toContain('Backend');
    expect(dom.text).toContain('read');
    expect(dom.text).toContain('write');
    expect(dom.q('app-managed-client-token-tools')).not.toBeNull();
  });

  it('shows an empty state', () => {
    expect(create([]).text).toContain('no tiene clientes M2M');
  });

  it('reports load errors without rendering the token tools', () => {
    service = jasmine.createSpyObj('ManagedClientService', ['list']);
    service.list.and.returnValue(throwError(() => new Error('x')));
    toast = jasmine.createSpyObj('ToastService', ['error']);
    TestBed.configureTestingModule({
      providers: [
        { provide: ManagedClientService, useValue: service },
        { provide: ToastService, useValue: toast },
        { provide: ActivatedRoute, useValue: { parent: { snapshot: { paramMap: convertToParamMap({ applicationId: 'a1' }) } } } },
      ],
    });
    const fixture = TestBed.createComponent(ApplicationManagedClientsComponent);
    fixture.detectChanges();
    expect(toast.error).toHaveBeenCalledWith('Error al cargar los clientes M2M');
  });

  it('registers a client, splitting the scopes and showing the one-time secret', () => {
    const dom = create([]);
    service.create.and.returnValue(
      of({ clientId: 'c2', clientSecret: 'S3CRET', name: 'Nuevo', applicationId: 'a1', scopes: ['a', 'b'], active: true, createdAt: 'now' }),
    );
    dom.type('input[formControlName=name]', 'Nuevo');
    dom.type('input[formControlName=scopes]', ' a, b ,, ');
    dom.type('input[formControlName=description]', 'Desc');
    dom.submit();
    expect(service.create).toHaveBeenCalledWith({
      name: 'Nuevo',
      applicationId: 'a1',
      scopes: ['a', 'b'],
      description: 'Desc',
      active: true,
    });
    expect(dom.text).toContain('S3CRET');
    expect(dom.text).toContain('Nuevo');
    expect(toast.success).toHaveBeenCalledWith('Cliente M2M registrado');
    expect(dom.q<HTMLInputElement>('input[formControlName=name]')!.value).toBe('');
  });

  it('does not submit an invalid form and reports create errors', () => {
    const dom = create([]);
    dom.submit();
    expect(service.create).not.toHaveBeenCalled();

    service.create.and.returnValue(throwError(() => new Error('x')));
    dom.type('input[formControlName=name]', 'N');
    dom.type('input[formControlName=scopes]', 's');
    dom.submit();
    expect(toast.error).toHaveBeenCalledWith('Error al registrar el cliente');
  });

  it('copies and dismisses the one-time secret', async () => {
    const dom = create([]);
    service.create.and.returnValue(
      of({ clientId: 'c2', clientSecret: 'S3CRET', name: 'N', applicationId: 'a1', scopes: ['a'], active: true }),
    );
    dom.type('input[formControlName=name]', 'N');
    dom.type('input[formControlName=scopes]', 'a');
    dom.submit();
    const writeText = spyOn(navigator.clipboard, 'writeText').and.resolveTo();
    dom.clickByText('button', 'Copiar');
    await dom.fixture.whenStable();
    expect(writeText).toHaveBeenCalledWith('S3CRET');
    expect(toast.success).toHaveBeenCalledWith('Secreto copiado al portapapeles');
    dom.clickByText('button', 'Cerrar');
    expect(dom.text).not.toContain('S3CRET');
  });

  it('reports clipboard failures', async () => {
    const dom = create([]);
    service.create.and.returnValue(
      of({ clientId: 'c2', clientSecret: 'S3CRET', name: 'N', applicationId: 'a1', scopes: ['a'], active: true }),
    );
    dom.type('input[formControlName=name]', 'N');
    dom.type('input[formControlName=scopes]', 'a');
    dom.submit();
    spyOn(navigator.clipboard, 'writeText').and.rejectWith(new Error('denied'));
    dom.clickByText('button', 'Copiar');
    await dom.fixture.whenStable();
    await new Promise((r) => setTimeout(r));
    expect(toast.error).toHaveBeenCalledWith('No se pudo copiar al portapapeles');
  });

  it('toggles the active state and reports errors', () => {
    const dom = create();
    service.update.and.returnValue(of({ ...client, active: false }));
    dom.click('button[title=Desactivar]');
    expect(service.update).toHaveBeenCalledWith('c1', { active: false });
    expect(dom.q('button[title=Activar]')).not.toBeNull();

    service.update.and.returnValue(throwError(() => new Error('x')));
    dom.click('button[title=Activar]');
    expect(toast.error).toHaveBeenCalledWith('Error al actualizar el estado');
  });

  it('rotates the secret after confirmation and shows the grace period', () => {
    const dom = create();
    service.rotateSecret.and.returnValue(of({ clientId: 'c1', clientSecret: 'NEW', gracePeriodSeconds: 300 }));
    dom.click('button[title="Rotar secreto"]');
    expect(dom.text).toContain('¿Rotar el secreto');
    dom.clickByText('app-confirm-dialog button', 'Confirmar');
    expect(service.rotateSecret).toHaveBeenCalledWith('c1');
    expect(dom.text).toContain('NEW');
    expect(dom.text).toContain('300 segundos');
    dom.clickByText('button', 'Cerrar');
    expect(dom.text).not.toContain('NEW');
  });

  it('rotates without grace period and reports rotate errors', () => {
    const dom = create();
    service.rotateSecret.and.returnValue(of({ clientId: 'c1', clientSecret: 'NEW' }));
    dom.click('button[title="Rotar secreto"]');
    dom.clickByText('app-confirm-dialog button', 'Confirmar');
    expect(dom.text).not.toContain('segundos');
    dom.clickByText('button', 'Copiar');

    service.rotateSecret.and.returnValue(throwError(() => new Error('x')));
    dom.click('button[title="Rotar secreto"]');
    dom.clickByText('app-confirm-dialog button', 'Confirmar');
    expect(toast.error).toHaveBeenCalledWith('Error al rotar el secreto');
  });

  it('revokes all tokens after confirmation and reports errors', () => {
    const dom = create();
    service.revokeAllTokens.and.returnValue(of(undefined));
    dom.click('button[title="Revocar todos los tokens"]');
    dom.clickByText('app-confirm-dialog button', 'Confirmar');
    expect(service.revokeAllTokens).toHaveBeenCalledWith('c1');
    expect(toast.success).toHaveBeenCalledWith('Tokens revocados');

    service.revokeAllTokens.and.returnValue(throwError(() => new Error('x')));
    dom.click('button[title="Revocar todos los tokens"]');
    dom.clickByText('app-confirm-dialog button', 'Confirmar');
    expect(toast.error).toHaveBeenCalledWith('Error al revocar los tokens');
  });

  it('deletes a client after confirmation and reports errors; cancelling does nothing', () => {
    const dom = create();
    dom.click('button[title=Eliminar]');
    dom.clickByText('app-confirm-dialog button', 'Cancelar');
    expect(service.delete).not.toHaveBeenCalled();

    service.delete.and.returnValue(throwError(() => new Error('x')));
    dom.click('button[title=Eliminar]');
    dom.clickByText('app-confirm-dialog button', 'Confirmar');
    expect(toast.error).toHaveBeenCalledWith('Error al eliminar el cliente');

    service.delete.and.returnValue(of(undefined));
    dom.click('button[title=Eliminar]');
    dom.clickByText('app-confirm-dialog button', 'Confirmar');
    expect(toast.success).toHaveBeenCalledWith('Cliente eliminado');
    expect(dom.text).not.toContain('Backend');
  });
});
