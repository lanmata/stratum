import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { FederationService } from '@core/services/federation.service';
import { FederationCompleteComponent, safeReturnTo } from './federation-complete.component';

describe('FederationCompleteComponent', () => {
  let auth: jasmine.SpyObj<AuthService>;
  let federation: jasmine.SpyObj<FederationService>;
  let router: jasmine.SpyObj<Router>;

  function create(inputs: { ticket?: string; returnTo?: string }) {
    auth = jasmine.createSpyObj('AuthService', ['startFederatedSession']);
    federation = jasmine.createSpyObj('FederationService', ['exchange']);
    router = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);
    router.navigate.and.resolveTo(true);
    router.navigateByUrl.and.resolveTo(true);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: FederationService, useValue: federation },
        { provide: Router, useValue: router },
      ],
    });
    const fixture = TestBed.createComponent(FederationCompleteComponent);
    if (inputs.ticket !== undefined) fixture.componentRef.setInput('ticket', inputs.ticket);
    if (inputs.returnTo !== undefined) fixture.componentRef.setInput('returnTo', inputs.returnTo);
    return fixture;
  }

  it('cambia el ticket por la sesión, la guarda y va a la ruta pedida', () => {
    const fixture = create({ ticket: 't-1', returnTo: '/applications' });
    federation.exchange.and.returnValue(of({ token: 'a', refreshToken: 'b' }));

    fixture.detectChanges();

    expect(federation.exchange).toHaveBeenCalledOnceWith('t-1');
    expect(auth.startFederatedSession).toHaveBeenCalledOnceWith({ token: 'a', refreshToken: 'b' });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/applications');
    expect(fixture.nativeElement.textContent).toContain('Completando');
  });

  it('una ruta de vuelta ajena se cambia por el dashboard', () => {
    const fixture = create({ ticket: 't-1', returnTo: '//evil.example' });
    federation.exchange.and.returnValue(of({ token: 'a', refreshToken: 'b' }));
    fixture.detectChanges();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('sin ticket vuelve al acceso con «expiró» y no llama al BFF', () => {
    const fixture = create({});
    fixture.detectChanges();
    expect(federation.exchange).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], { queryParams: { error: 'expired' } });
  });

  it('un ticket que el BFF rechaza, o sin token, vuelve al acceso', () => {
    const failing = create({ ticket: 'old' });
    federation.exchange.and.returnValue(throwError(() => new Error('401')));
    failing.detectChanges();
    expect(auth.startFederatedSession).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], { queryParams: { error: 'expired' } });
  });

  it('safeReturnTo solo acepta rutas del sitio', () => {
    expect(safeReturnTo('/users')).toBe('/users');
    for (const value of [undefined, null, '', 'users', '//evil', 'https://evil', '/\\evil', '/a\r\nb']) {
      expect(safeReturnTo(value as string)).toBe('/dashboard');
    }
  });
});
