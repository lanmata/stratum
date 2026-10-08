import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { ApplicationService } from '@core/services/application.service';
import { IamService } from '@core/services/iam.service';
import { ToastService } from '@core/services/toast.service';
import { SessionStoreService } from '@core/store/session/session.store.service';
import { IamToolsComponent } from './iam-tools.component';

describe('IamToolsComponent', () => {
  let iam: jasmine.SpyObj<IamService>;
  let apps: jasmine.SpyObj<ApplicationService>;
  let toast: jasmine.SpyObj<ToastService>;
  let token$: BehaviorSubject<string | null>;

  function create(token: string | null = 'my-token', appList: unknown = of([{ id: 'a1', name: 'Alpha', active: true }])) {
    iam = jasmine.createSpyObj('IamService', ['introspectToken', 'checkPermission']);
    apps = jasmine.createSpyObj('ApplicationService', ['getAll']);
    toast = jasmine.createSpyObj('ToastService', ['error']);
    apps.getAll.and.returnValue(appList as never);
    token$ = new BehaviorSubject<string | null>(token);
    TestBed.configureTestingModule({
      providers: [
        { provide: IamService, useValue: iam },
        { provide: ApplicationService, useValue: apps },
        { provide: ToastService, useValue: toast },
        { provide: SessionStoreService, useValue: { token$ } },
      ],
    });
    const fixture = TestBed.createComponent(IamToolsComponent);
    fixture.detectChanges();
    return new Dom(fixture);
  }

  describe('token introspection', () => {
    it('prefills the current session token and introspects it', () => {
      const dom = create();
      iam.introspectToken.and.returnValue(
        of({ active: true, subject: 'u1', issuer: 'iss', audience: 'aud', tokenType: 'session', issuedAt: 1_700_000_000, expiresAt: 1_700_003_600, roles: ['ADMIN', 'USER'] }),
      );
      dom.clickByText('button', 'Usar mi token');
      expect(dom.q<HTMLTextAreaElement>('#iam-token')!.value).toBe('my-token');
      dom.submit('section:first-of-type form');
      expect(iam.introspectToken).toHaveBeenCalledWith('my-token');
      for (const t of ['Sí', 'u1', 'iss', 'aud', 'session', 'ADMIN, USER']) expect(dom.text).toContain(t);
    });

    it('trims the pasted token and shows a minimal inactive result', () => {
      const dom = create();
      iam.introspectToken.and.returnValue(of({ active: false }));
      dom.type('#iam-token', '  abc  ');
      dom.submit('section:first-of-type form');
      expect(iam.introspectToken).toHaveBeenCalledWith('abc');
      expect(dom.text).toContain('No');
    });

    it('does nothing with an empty token and reports failures', () => {
      const dom = create();
      dom.submit('section:first-of-type form');
      expect(iam.introspectToken).not.toHaveBeenCalled();

      iam.introspectToken.and.returnValue(throwError(() => new Error('x')));
      dom.type('#iam-token', 'abc');
      dom.submit('section:first-of-type form');
      expect(toast.error).toHaveBeenCalledWith('Error al introspeccionar el token');
    });

    it('disables "use my token" when there is no session', () => {
      const dom = create(null);
      expect(dom.qa<HTMLButtonElement>('button').find((b) => b.textContent!.includes('Usar mi token'))!.disabled).toBeTrue();
      (dom.fixture.componentInstance as unknown as { useMyToken(c: { setValue(v: string): void }): void }).useMyToken({
        setValue: () => fail('should not set'),
      });
    });
  });

  describe('permission check', () => {
    const fill = (dom: Dom<IamToolsComponent>, appId = '') => {
      dom.type('#iam-permission', ' ROLE_ADMIN ');
      dom.type('#iam-session-token', ' tok ');
      if (appId) dom.type('#iam-application', appId);
    };

    it('checks a permission scoped to an application', () => {
      const dom = create();
      iam.checkPermission.and.returnValue(of({ granted: true, permission: 'ROLE_ADMIN', reason: 'via role' }));
      fill(dom, 'a1');
      dom.submit('section:last-of-type form');
      expect(iam.checkPermission).toHaveBeenCalledWith({ permission: 'ROLE_ADMIN', sessionToken: 'tok', applicationId: 'a1' });
      expect(dom.text).toContain('Permiso concedido');
      expect(dom.text).toContain('via role');
    });

    it('omits the application when none is chosen and shows denials', () => {
      const dom = create();
      iam.checkPermission.and.returnValue(of({ granted: false, permission: 'ROLE_ADMIN' }));
      fill(dom);
      dom.submit('section:last-of-type form');
      expect(iam.checkPermission).toHaveBeenCalledWith({ permission: 'ROLE_ADMIN', sessionToken: 'tok' });
      expect(dom.text).toContain('Permiso denegado');
    });

    it('uses my token and reports failures', () => {
      const dom = create();
      dom.qa('button').filter((b) => b.textContent!.includes('Usar mi token'))[1].click();
      dom.fixture.detectChanges();
      expect(dom.q<HTMLTextAreaElement>('#iam-session-token')!.value).toBe('my-token');

      iam.checkPermission.and.returnValue(throwError(() => new Error('x')));
      dom.type('#iam-permission', 'X');
      dom.submit('section:last-of-type form');
      expect(toast.error).toHaveBeenCalledWith('Error al verificar el permiso');
    });

    it('ignores an invalid form', () => {
      const dom = create();
      dom.submit('section:last-of-type form');
      expect(iam.checkPermission).not.toHaveBeenCalled();
    });
  });

  it('works when applications cannot be loaded', () => {
    const dom = create('t', throwError(() => new Error('x')));
    expect(dom.qa('#iam-application option').length).toBe(1);
  });
});
