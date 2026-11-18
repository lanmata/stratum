import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { ApplicationService } from '@core/services/application.service';
import { FederationService } from '@core/services/federation.service';
import { ToastService } from '@core/services/toast.service';
import { Application } from '@shared/models/application.model';
import { IdentityProvider } from '@shared/models/federation.model';
import { ProvidersPageComponent, splitList } from './providers-page.component';

const APP: Application = { id: 'a1', name: 'Iris', active: true };
const GOOGLE: IdentityProvider = {
  id: 'p1', applicationId: 'a1', provider: 'google', providerType: 'oidc', clientId: 'c1', clientSecretRef: 'SECRET',
  issuer: null, scopes: null, redirectUris: ['https://iris/cb'], allowedEmailDomains: ['corp.com'], trustedEmail: true, enabled: true,
};
const httpError = (status: number) => throwError(() => new HttpErrorResponse({ status }));

describe('ProvidersPageComponent', () => {
  let federation: jasmine.SpyObj<FederationService>;
  let applications: jasmine.SpyObj<ApplicationService>;
  let toast: jasmine.SpyObj<ToastService>;

  async function create(options: { applicationsError?: boolean } = {}) {
    federation = jasmine.createSpyObj('FederationService', ['listProviders', 'createProvider', 'updateProvider', 'deleteProvider']);
    applications = jasmine.createSpyObj('ApplicationService', ['getAll']);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    applications.getAll.and.returnValue(options.applicationsError ? httpError(500) : of([APP]));
    federation.listProviders.and.returnValue(of([GOOGLE]));
    federation.createProvider.and.returnValue(of(GOOGLE));
    federation.updateProvider.and.returnValue(of(GOOGLE));
    federation.deleteProvider.and.returnValue(of(undefined));
    TestBed.configureTestingModule({
      providers: [
        { provide: FederationService, useValue: federation },
        { provide: ApplicationService, useValue: applications },
        { provide: ToastService, useValue: toast },
      ],
    });
    const fixture = TestBed.createComponent(ProvidersPageComponent);
    fixture.detectChanges();
    const dom = new Dom(fixture);
    await dom.stable();
    return dom;
  }

  async function select(dom: Dom<ProvidersPageComponent>) {
    dom.type('#fed-application', 'a1');
    await dom.stable();
  }

  it('carga las aplicaciones y, sin elegir una, no lista proveedores', async () => {
    const dom = await create();
    expect(applications.getAll).toHaveBeenCalled();
    expect(dom.qa('#fed-application option').length).toBe(2);
    expect(federation.listProviders).not.toHaveBeenCalled();
    expect(dom.q('[data-testid=new]')).toBeNull();
  });

  it('si no se pueden cargar las aplicaciones, avisa', async () => {
    const dom = await create({ applicationsError: true });
    expect(dom.q('[data-testid=problem]')!.textContent).toContain('aplicaciones');
  });

  it('al elegir la aplicación lista sus proveedores y nunca muestra un secreto, solo la referencia', async () => {
    const dom = await create();
    await select(dom);

    expect(federation.listProviders).toHaveBeenCalledOnceWith('a1');
    expect(dom.q('[data-provider-row=google]')).not.toBeNull();
    expect(dom.text).toContain('SECRET');
    expect(dom.text).toContain('corp.com');
  });

  it('volver a «elige una aplicación» limpia la lista', async () => {
    const dom = await create();
    await select(dom);
    dom.type('#fed-application', '');
    await dom.stable();
    expect(dom.q('[data-provider-row=google]')).toBeNull();
  });

  it('sin proveedores lo dice, y un 403 explica el permiso', async () => {
    const dom = await create();
    federation.listProviders.and.returnValue(of([]));
    await select(dom);
    expect(dom.text).toContain('no ofrece proveedores');

    federation.listProviders.and.returnValue(httpError(403));
    dom.type('#fed-application', '');
    dom.type('#fed-application', 'a1');
    await dom.stable();
    expect(dom.q('[data-testid=problem]')!.textContent).toContain('FEDERATION_ADMIN');

    federation.listProviders.and.returnValue(httpError(500));
    dom.type('#fed-application', '');
    dom.type('#fed-application', 'a1');
    await dom.stable();
    expect(dom.q('[data-testid=problem]')!.textContent).toContain('No pudimos cargar');
  });

  it('configura un proveedor nuevo: una URI por línea y dominios separados por comas', async () => {
    const dom = await create();
    await select(dom);
    dom.click('[data-testid=new]');

    dom.type('#fed-provider', 'github');
    dom.type('#fed-client-id', ' client ');
    dom.type('#fed-secret-ref', 'FED_GITHUB_SECRET');
    dom.type('#fed-redirects', 'https://iris/cb\n\nhttps://stratum/cb\n');
    dom.type('#fed-domains', 'corp.com, other.org');
    dom.submit('[data-testid=form]');
    await dom.stable();

    expect(federation.createProvider).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      applicationId: 'a1', provider: 'github', clientId: 'client', clientSecretRef: 'FED_GITHUB_SECRET',
      redirectUris: ['https://iris/cb', 'https://stratum/cb'], allowedEmailDomains: ['corp.com', 'other.org'],
      trustedEmail: true, enabled: false,
    }));
    expect(toast.success).toHaveBeenCalled();
    expect(dom.q('[data-testid=form]')).toBeNull();
  });

  it('el formulario no se envía incompleto ni con una referencia que parezca un secreto con espacios', async () => {
    const dom = await create();
    await select(dom);
    dom.click('[data-testid=new]');
    dom.type('#fed-client-id', 'c');
    dom.type('#fed-secret-ref', 'not a reference');
    dom.type('#fed-redirects', 'https://iris/cb');
    dom.submit('[data-testid=form]');

    expect(federation.createProvider).not.toHaveBeenCalled();
    expect(dom.q<HTMLButtonElement>('[data-testid=form] button[type=submit]')!.disabled).toBeTrue();
  });

  it('edita un proveedor: el proveedor no cambia y se conserva el resto del ajuste', async () => {
    const dom = await create();
    await select(dom);
    dom.click('[data-action=edit]');
    expect(dom.q<HTMLSelectElement>('#fed-provider')!.disabled).toBeTrue();
    dom.type('#fed-client-id', 'c2');
    dom.submit('[data-testid=form]');
    await dom.stable();

    expect(federation.updateProvider).toHaveBeenCalledOnceWith('p1', jasmine.objectContaining({
      provider: 'google', clientId: 'c2', redirectUris: ['https://iris/cb'], allowedEmailDomains: ['corp.com'],
    }));
  });

  it('cancelar cierra el formulario', async () => {
    const dom = await create();
    await select(dom);
    dom.click('[data-testid=new]');
    dom.click('[data-testid=cancel]');
    expect(dom.q('[data-testid=form]')).toBeNull();
  });

  it('un error al guardar explica la causa', async () => {
    const dom = await create();
    await select(dom);
    for (const [status, text] of [[409, 'ya está configurado'], [400, 'HTTPS'], [403, 'FEDERATION_ADMIN'], [500, 'No pudimos guardar']] as const) {
      federation.createProvider.and.returnValue(httpError(status));
      dom.click('[data-testid=new]');
      dom.type('#fed-client-id', 'c');
      dom.type('#fed-secret-ref', 'S');
      dom.type('#fed-redirects', 'https://iris/cb');
      dom.submit('[data-testid=form]');
      await dom.stable();
      expect(dom.q('[data-testid=problem]')!.textContent).toContain(text);
    }
  });

  it('el interruptor enciende o apaga el proveedor sin tocar el resto', async () => {
    const dom = await create();
    await select(dom);
    dom.check('[data-provider-row=google] input[type=checkbox]', false);

    expect(federation.updateProvider).toHaveBeenCalledOnceWith('p1', jasmine.objectContaining({ enabled: false, clientSecretRef: 'SECRET', redirectUris: ['https://iris/cb'] }));

    federation.updateProvider.and.returnValue(httpError(403));
    dom.check('[data-provider-row=google] input[type=checkbox]', true);
    await dom.stable();
    expect(dom.q('[data-testid=problem]')!.textContent).toContain('FEDERATION_ADMIN');
  });

  it('quitar pide confirmación y, si hay usuarios enlazados, lo explica', async () => {
    const dom = await create();
    await select(dom);
    dom.click('[data-action=delete]');
    dom.click('app-confirm-dialog button:last-of-type');
    expect(federation.deleteProvider).toHaveBeenCalledOnceWith('p1');
    expect(toast.success).toHaveBeenCalled();

    federation.deleteProvider.and.returnValue(httpError(409));
    dom.click('[data-action=delete]');
    dom.click('app-confirm-dialog button:last-of-type');
    await dom.stable();
    expect(dom.q('[data-testid=problem]')!.textContent).toContain('usuarios enlazados');

    dom.click('[data-action=delete]');
    dom.click('app-confirm-dialog button:first-of-type');
    expect(dom.q('app-confirm-dialog')).toBeNull();
  });

  it('splitList descarta lo vacío y recorta', () => {
    expect(splitList(' a ,, b ', /,/)).toEqual(['a', 'b']);
    expect(splitList(undefined, /,/)).toEqual([]);
    expect(splitList(null, /\n/)).toEqual([]);
  });
});
