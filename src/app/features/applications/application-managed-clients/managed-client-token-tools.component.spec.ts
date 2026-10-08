import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { ManagedClientService } from '@core/services/managed-client.service';
import { ToastService } from '@core/services/toast.service';
import {
  issueErrorMessage,
  ManagedClientTokenToolsComponent,
  splitScopes,
} from './managed-client-token-tools.component';

describe('token tools helpers', () => {
  it('splits scopes on commas and whitespace', () => {
    expect(splitScopes(' a,b  c ,, ')).toEqual(['a', 'b', 'c']);
    expect(splitScopes('')).toEqual([]);
  });

  it('maps token endpoint statuses to messages', () => {
    expect(issueErrorMessage(400)).toContain('scope');
    expect(issueErrorMessage(401)).toContain('Credenciales');
    expect(issueErrorMessage(429)).toContain('Demasiadas');
    expect(issueErrorMessage(500)).toBe('Error al emitir el token.');
  });
});

describe('ManagedClientTokenToolsComponent', () => {
  let service: jasmine.SpyObj<ManagedClientService>;
  let toast: jasmine.SpyObj<ToastService>;

  function create() {
    service = jasmine.createSpyObj('ManagedClientService', ['issueToken', 'introspectToken']);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    TestBed.configureTestingModule({
      providers: [
        { provide: ManagedClientService, useValue: service },
        { provide: ToastService, useValue: toast },
      ],
    });
    const fixture = TestBed.createComponent(ManagedClientTokenToolsComponent);
    fixture.componentRef.setInput('clients', [
      { clientId: 'c1', name: 'Backend', applicationId: 'a', scopes: [], active: true },
    ]);
    fixture.detectChanges();
    return new Dom(fixture);
  }

  const fillIssue = (dom: Dom<ManagedClientTokenToolsComponent>) => {
    dom.type('#issue-client', 'c1');
    dom.type('#issue-secret', 'shh');
    dom.type('#issue-scopes', 'read, write');
  };

  it('offers the application clients in the selector', () => {
    expect(create().qa('#issue-client option').map((o) => o.textContent!.trim())).toEqual(['— Seleccionar cliente —', 'Backend']);
  });

  it('issues a token and clears the secret from the form', () => {
    const dom = create();
    service.issueToken.and.returnValue(
      of({ accessToken: 'AT', tokenType: 'Bearer', expiresIn: 3600, scopes: ['read', 'write'] }),
    );
    fillIssue(dom);
    dom.submit('section:first-of-type form');
    expect(service.issueToken).toHaveBeenCalledWith({ clientId: 'c1', clientSecret: 'shh', scopes: ['read', 'write'] });
    expect(dom.text).toContain('AT');
    expect(dom.text).toContain('3600s');
    expect(dom.q<HTMLInputElement>('#issue-secret')!.value).toBe('');
  });

  it('does not issue with an invalid form or only separators as scopes', () => {
    const dom = create();
    dom.submit('section:first-of-type form');
    expect(service.issueToken).not.toHaveBeenCalled();
    dom.type('#issue-client', 'c1');
    dom.type('#issue-secret', 'shh');
    dom.type('#issue-scopes', ' , ');
    dom.submit('section:first-of-type form');
    expect(service.issueToken).not.toHaveBeenCalled();
  });

  it('explains why a token could not be issued', () => {
    const dom = create();
    service.issueToken.and.returnValue(throwError(() => ({ status: 401 })));
    fillIssue(dom);
    dom.submit('section:first-of-type form');
    expect(dom.text).toContain('Credenciales inválidas');
    expect(dom.q<HTMLButtonElement>('form button[type=submit]')!.disabled).toBeFalse();
  });

  it('copies the issued token', async () => {
    const dom = create();
    service.issueToken.and.returnValue(of({ accessToken: 'AT', tokenType: 'Bearer', expiresIn: 1, scopes: ['a'] }));
    fillIssue(dom);
    dom.submit('section:first-of-type form');
    const writeText = spyOn(navigator.clipboard, 'writeText').and.resolveTo();
    dom.clickByText('button', 'Copiar token');
    await dom.fixture.whenStable();
    expect(writeText).toHaveBeenCalledWith('AT');
    expect(toast.success).toHaveBeenCalledWith('Token copiado al portapapeles');
  });

  it('reports clipboard failures', async () => {
    const dom = create();
    service.issueToken.and.returnValue(of({ accessToken: 'AT', tokenType: 'Bearer', expiresIn: 1, scopes: ['a'] }));
    fillIssue(dom);
    dom.submit('section:first-of-type form');
    spyOn(navigator.clipboard, 'writeText').and.rejectWith(new Error('no'));
    dom.clickByText('button', 'Copiar token');
    await dom.fixture.whenStable();
    await new Promise((r) => setTimeout(r));
    expect(toast.error).toHaveBeenCalledWith('No se pudo copiar al portapapeles');
  });

  it('introspects a token and renders every returned field', () => {
    const dom = create();
    service.introspectToken.and.returnValue(
      of({ active: true, clientId: 'c1', clientName: 'Backend', scopes: ['a'], issuer: 'iss', iat: 1_700_000_000, exp: 1_700_003_600, jti: 'j1' }),
    );
    dom.type('#introspect-token', '  tok  ');
    dom.submit('section:last-of-type form');
    expect(service.introspectToken).toHaveBeenCalledWith('tok');
    for (const t of ['Sí', 'Backend', 'iss', 'j1']) expect(dom.text).toContain(t);
  });

  it('renders a minimal inactive introspection and reports errors', () => {
    const dom = create();
    service.introspectToken.and.returnValue(of({ active: false }));
    dom.type('#introspect-token', 'tok');
    dom.submit('section:last-of-type form');
    expect(dom.text).toContain('No');

    service.introspectToken.and.returnValue(throwError(() => new Error('x')));
    dom.submit('section:last-of-type form');
    expect(toast.error).toHaveBeenCalledWith('Error al introspeccionar el token');
  });

  it('ignores an empty introspection form', () => {
    const dom = create();
    dom.submit('section:last-of-type form');
    expect(service.introspectToken).not.toHaveBeenCalled();
  });
});
