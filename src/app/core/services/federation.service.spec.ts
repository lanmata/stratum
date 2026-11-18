import { DOCUMENT } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { createHttpSpy, HttpSpy, provideHttpSpy } from '@app/testing/http-spy';
import { API } from '@shared/constants/api.constants';
import { FEDERATION_MESSAGES, federationMessage, IdentityProviderRequest } from '@shared/models/federation.model';
import { FederationService } from './federation.service';

describe('FederationService', () => {
  let http: HttpSpy;
  let controller: HttpTestingController;
  let assign: jasmine.Spy;
  let service: FederationService;

  beforeEach(() => {
    http = createHttpSpy();
    assign = jasmine.createSpy('assign');
    TestBed.configureTestingModule({
      providers: [
        provideHttpSpy(http),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DOCUMENT, useValue: { location: { assign } } },
      ],
    });
    controller = TestBed.inject(HttpTestingController);
    service = TestBed.inject(FederationService);
  });

  afterEach(() => controller.verify());

  it('pide los proveedores al BFF y devuelve la lista si la función está activa', () => {
    let result: unknown;
    service.loadProviders().subscribe((value) => (result = value));
    controller.expectOne('/bff/federation/providers').flush({ enabled: true, providers: [{ provider: 'google', displayName: 'Google' }] });
    expect(result).toEqual([{ provider: 'google', displayName: 'Google' }]);
  });

  it('con la función apagada o sin lista devuelve vacío', () => {
    const results: unknown[] = [];
    service.loadProviders().subscribe((value) => results.push(value));
    controller.expectOne('/bff/federation/providers').flush({ enabled: false, providers: [{ provider: 'google', displayName: 'Google' }] });
    service.loadProviders().subscribe((value) => results.push(value));
    controller.expectOne('/bff/federation/providers').flush({ enabled: true });
    expect(results).toEqual([[], []]);
  });

  it('signIn navega al BFF con la ruta de vuelta codificada', () => {
    service.signIn('github', '/dashboard?x=1');
    expect(assign).toHaveBeenCalledOnceWith(`/bff/federation/github/start?returnTo=${encodeURIComponent('/dashboard?x=1')}`);
  });

  it('exchange cambia el ticket por la sesión', () => {
    let result: unknown;
    service.exchange('t-1').subscribe((value) => (result = value));
    const req = controller.expectOne('/bff/federation/exchange');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ ticket: 't-1' });
    req.flush({ token: 'a', refreshToken: 'b' });
    expect(result).toEqual({ token: 'a', refreshToken: 'b' });
  });

  it('administra los proveedores con la API normal', () => {
    const body: IdentityProviderRequest = { applicationId: 'a', provider: 'google', clientId: 'c', clientSecretRef: 'S', redirectUris: ['https://x/cb'], allowedEmailDomains: [] };
    service.listProviders('a').subscribe();
    service.createProvider(body).subscribe();
    service.updateProvider('p1', body).subscribe();
    service.deleteProvider('p1').subscribe();
    expect(http.get).toHaveBeenCalledWith(API.FEDERATION.PROVIDERS, { applicationId: 'a' });
    expect(http.post).toHaveBeenCalledWith(API.FEDERATION.PROVIDERS, body);
    expect(http.put).toHaveBeenCalledWith(API.FEDERATION.PROVIDER('p1'), body);
    expect(http.delete).toHaveBeenCalledWith(API.FEDERATION.PROVIDER('p1'));
  });

  it('lista y desenlaza las cuentas de un usuario', () => {
    http.get.and.returnValue(of([]));
    service.identities('u1').subscribe();
    service.unlink('u1', 'i1').subscribe();
    expect(http.get).toHaveBeenCalledWith(API.FEDERATION.IDENTITIES('u1'));
    expect(http.delete).toHaveBeenCalledWith(API.FEDERATION.IDENTITY('u1', 'i1'));
  });
});

describe('federationMessage', () => {
  it('traduce cada código, usa «falló» para uno nuevo y nada sin código', () => {
    Object.keys(FEDERATION_MESSAGES).forEach((code) => expect(federationMessage(code)).toBe(FEDERATION_MESSAGES[code]));
    expect(federationMessage('raro')).toBe(FEDERATION_MESSAGES['failed']);
    expect(federationMessage(undefined)).toBeNull();
    expect(federationMessage('')).toBeNull();
  });
});
