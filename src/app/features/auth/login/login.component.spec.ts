import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { AuthService } from '@core/services/auth.service';
import { FederationService } from '@core/services/federation.service';
import { FederationProvider } from '@shared/models/federation.model';
import { API } from '@shared/constants/api.constants';
import { LoginComponent } from './login.component';
import { signal } from '@angular/core';

describe('LoginComponent', () => {
  let auth: jasmine.SpyObj<AuthService> & { isLoading: ReturnType<typeof signal<boolean>> };
  let router: jasmine.SpyObj<Router>;

  let federation: jasmine.SpyObj<FederationService>;

  function create(options: { providers?: FederationProvider[]; error?: string; providersError?: boolean } = {}) {
    federation = jasmine.createSpyObj<FederationService>('FederationService', ['loadProviders', 'signIn']);
    federation.loadProviders.and.returnValue(options.providersError ? throwError(() => new Error('x')) : of(options.providers ?? []));
    auth = Object.assign(jasmine.createSpyObj<AuthService>('AuthService', ['loginWithAlias', 'loginWithEmail']), {
      isLoading: signal(false),
    }) as never;
    router = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        { provide: FederationService, useValue: federation },
      ],
    });
    const fixture = TestBed.createComponent(LoginComponent);
    if (options.error !== undefined) fixture.componentRef.setInput('error', options.error);
    fixture.detectChanges();
    return new Dom(fixture);
  }

  it('starts on the alias tab with the submit button disabled', () => {
    const dom = create();
    expect(dom.q('#login-mode-alias')!.getAttribute('aria-selected')).toBe('true');
    expect(dom.q<HTMLInputElement>('input[formControlName=identifier]')!.type).toBe('text');
    expect(dom.q<HTMLButtonElement>('button[type=submit]')!.disabled).toBeTrue();
  });

  it('logs in with the alias and the application id, then goes to the dashboard', () => {
    const dom = create();
    auth.loginWithAlias.and.returnValue(of(true));
    dom.type('input[formControlName=identifier]', 'ana');
    dom.type('input[formControlName=password]', 'secret');
    dom.submit();
    expect(auth.loginWithAlias).toHaveBeenCalledWith({
      alias: 'ana',
      password: 'secret',
      applicationId: API.APPLICATION.ID,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(auth.loginWithEmail).not.toHaveBeenCalled();
  });

  it('shows an error when the credentials are rejected', () => {
    const dom = create();
    auth.loginWithAlias.and.returnValue(of(false));
    dom.type('input[formControlName=identifier]', 'ana');
    dom.type('input[formControlName=password]', 'bad');
    dom.submit();
    expect(dom.text).toContain('Invalid credentials');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('switches to email login, validating the email format', () => {
    const dom = create();
    dom.click('#login-mode-email');
    expect(dom.q('#login-mode-email')!.getAttribute('aria-selected')).toBe('true');
    expect(dom.q<HTMLInputElement>('input[formControlName=identifier]')!.type).toBe('email');

    dom.type('input[formControlName=identifier]', 'not-an-email');
    dom.type('input[formControlName=password]', 'pw');
    expect(dom.q<HTMLButtonElement>('button[type=submit]')!.disabled).toBeTrue();
    dom.submit();
    expect(auth.loginWithEmail).not.toHaveBeenCalled();

    auth.loginWithEmail.and.returnValue(of(true));
    dom.type('input[formControlName=identifier]', 'ana@example.com');
    dom.submit();
    expect(auth.loginWithEmail).toHaveBeenCalledWith({ email: 'ana@example.com', password: 'pw' });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('clears the identifier and error when switching tabs, and ignores re-selecting the same tab', () => {
    const dom = create();
    auth.loginWithAlias.and.returnValue(of(false));
    dom.type('input[formControlName=identifier]', 'ana');
    dom.type('input[formControlName=password]', 'bad');
    dom.submit();
    expect(dom.text).toContain('Invalid credentials');

    dom.click('#login-mode-alias');
    expect(dom.text).toContain('Invalid credentials');
    dom.click('#login-mode-email');
    expect(dom.text).not.toContain('Invalid credentials');
    expect(dom.q<HTMLInputElement>('input[formControlName=identifier]')!.value).toBe('');
    dom.click('#login-mode-alias');
    expect(dom.q<HTMLInputElement>('input[formControlName=identifier]')!.type).toBe('text');
  });

  it('reflects the loading state on the button', () => {
    const dom = create();
    auth.isLoading.set(true);
    dom.fixture.detectChanges();
    expect(dom.q('button[type=submit]')!.textContent).toContain('Signing in');
    expect(new Subject()).toBeTruthy();
  });

  describe('acceso con proveedores', () => {
    const PROVIDERS: FederationProvider[] = [{ provider: 'google', displayName: 'Google' }, { provider: 'github', displayName: 'GitHub' }];

    it('sin proveedores no muestra la sección y los pide al abrir', () => {
      const dom = create();
      expect(federation.loadProviders).toHaveBeenCalled();
      expect(dom.q('[data-testid=federation]')).toBeNull();
    });

    it('muestra un botón por proveedor y al pulsarlo navega al BFF', () => {
      const dom = create({ providers: PROVIDERS });
      expect(dom.qa('[data-testid=federation] button').map((b) => b.textContent!.trim())).toEqual(['Continuar con Google', 'Continuar con GitHub']);
      dom.click('[data-provider=github]');
      expect(federation.signIn).toHaveBeenCalledOnceWith('github', '/dashboard');
    });

    it('si el BFF no responde, el acceso por contraseña sigue sin proveedores', () => {
      const dom = create({ providersError: true });
      expect(dom.q('[data-testid=federation]')).toBeNull();
      expect(dom.q('form')).not.toBeNull();
    });

    it('el código de error del BFF se muestra como mensaje', () => {
      expect(create({ error: 'not_registered' }).text).toContain('no está registrada');
    });

    it('un código desconocido muestra el mensaje genérico', () => {
      expect(create({ error: 'raro' }).text).toContain('No pudimos verificar');
    });
  });
});
