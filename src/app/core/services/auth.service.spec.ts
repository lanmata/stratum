import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { SessionStoreService } from '@core/store/session/session.store.service';
import { API } from '@shared/constants/api.constants';
import { createHttpSpy, HttpSpy, provideHttpSpy } from '@app/testing/http-spy';
import { AuthService } from './auth.service';

function jwt(payload: object): string {
  return `h.${btoa(JSON.stringify(payload))}.s`;
}

describe('AuthService', () => {
  let http: HttpSpy;
  let store: jasmine.SpyObj<SessionStoreService>;
  let router: jasmine.SpyObj<Router>;
  let auth: AuthService;

  beforeEach(() => {
    http = createHttpSpy();
    store = jasmine.createSpyObj('SessionStoreService', ['save', 'refresh', 'clear']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpSpy(http),
        { provide: SessionStoreService, useValue: store },
        { provide: Router, useValue: router },
      ],
    });
    auth = TestBed.inject(AuthService);
  });

  describe('loginWithAlias', () => {
    it('saves the session with the typed alias', () => {
      const token = jwt({ sub: 'u1', alias: 'from-token' });
      http.post.and.returnValue(of({ token, refreshToken: 'r' }) as never);
      let ok: boolean | undefined;
      auth.loginWithAlias({ alias: 'ana', password: 'pw', applicationId: 'app' }).subscribe((v) => (ok = v));
      expect(http.post).toHaveBeenCalledWith(API.SESSION.ROOT, { alias: 'ana', password: 'pw', applicationId: 'app' });
      expect(ok).toBeTrue();
      const [savedToken, savedRefresh, user] = store.save.calls.mostRecent().args;
      expect(savedToken).toBe(token);
      expect(savedRefresh).toBe('r');
      expect(user.alias).toBe('ana');
      expect(auth.isLoading()).toBeFalse();
    });

    it('emits false and stops loading when the request fails', () => {
      http.post.and.returnValue(throwError(() => new Error('401')) as never);
      let ok: boolean | undefined;
      auth.loginWithAlias({ alias: 'a', password: 'p', applicationId: 'x' }).subscribe((v) => (ok = v));
      expect(ok).toBeFalse();
      expect(store.save).not.toHaveBeenCalled();
      expect(auth.isLoading()).toBeFalse();
    });

    it('is loading while the request is in flight', () => {
      const pending = new Subject<unknown>();
      http.post.and.returnValue(pending as never);
      auth.loginWithAlias({ alias: 'a', password: 'p', applicationId: 'x' }).subscribe();
      expect(auth.isLoading()).toBeTrue();
      pending.next({ token: jwt({}), refreshToken: 'r' });
      pending.complete();
      expect(auth.isLoading()).toBeFalse();
    });
  });

  describe('loginWithEmail', () => {
    it('saves the session decoded from the token', () => {
      const token = jwt({ sub: 'u2', alias: 'tok-alias', email: 'a@b.c' });
      http.post.and.returnValue(of({ token, refreshToken: 'r' }) as never);
      let ok: boolean | undefined;
      auth.loginWithEmail({ email: 'a@b.c', password: 'pw' }).subscribe((v) => (ok = v));
      expect(http.post).toHaveBeenCalledWith(API.SESSION.TOKEN, { email: 'a@b.c', password: 'pw' });
      expect(ok).toBeTrue();
      expect(store.save.calls.mostRecent().args[2].alias).toBe('tok-alias');
    });

    it('emits false on failure', () => {
      http.post.and.returnValue(throwError(() => new Error('x')) as never);
      let ok: boolean | undefined;
      auth.loginWithEmail({ email: 'a@b.c', password: 'pw' }).subscribe((v) => (ok = v));
      expect(ok).toBeFalse();
      expect(auth.isLoading()).toBeFalse();
    });
  });

  describe('refresh', () => {
    it('stores the new tokens', () => {
      http.post.and.returnValue(of({ token: 't2', refreshToken: 'r2' }) as never);
      let ok: boolean | undefined;
      auth.refresh({ refreshToken: 'r' }).subscribe((v) => (ok = v));
      expect(http.post).toHaveBeenCalledWith(API.SESSION.REFRESH, { refreshToken: 'r' });
      expect(store.refresh).toHaveBeenCalledWith('t2', 'r2');
      expect(ok).toBeTrue();
    });

    it('emits false when the refresh token is rejected', () => {
      http.post.and.returnValue(throwError(() => ({ status: 401 })) as never);
      let ok: boolean | undefined;
      auth.refresh({ refreshToken: 'r' }).subscribe((v) => (ok = v));
      expect(ok).toBeFalse();
      expect(store.refresh).not.toHaveBeenCalled();
    });
  });

  describe('backend outages', () => {
    it('are not reported as an invalid session', () => {
      const errors: unknown[] = [];
      http.post.and.returnValue(throwError(() => ({ status: 502 })) as never);
      http.get.and.returnValue(throwError(() => ({ status: 0 })) as never);
      auth.refresh({ refreshToken: 'r' }).subscribe({ error: (e) => errors.push(e) });
      auth.validate().subscribe({ error: (e) => errors.push(e) });
      auth.renew().subscribe({ error: (e) => errors.push(e) });
      expect(errors).toEqual([{ status: 502 }, { status: 0 }, { status: 0 }]);
    });
  });

  describe('validate', () => {
    it('is true only when the server answers true', () => {
      http.get.and.returnValue(of(true) as never);
      let ok: boolean | undefined;
      auth.validate().subscribe((v) => (ok = v));
      expect(http.get).toHaveBeenCalledWith(API.SESSION.VALIDATE);
      expect(ok).toBeTrue();

      http.get.and.returnValue(of(false) as never);
      auth.validate().subscribe((v) => (ok = v));
      expect(ok).toBeFalse();
    });

    it('is false when the request fails', () => {
      http.get.and.returnValue(throwError(() => ({ status: 401 })) as never);
      let ok: boolean | undefined;
      auth.validate().subscribe((v) => (ok = v));
      expect(ok).toBeFalse();
    });
  });

  describe('renew', () => {
    it('stores the renewed tokens', () => {
      http.get.and.returnValue(of({ token: 't3', refreshToken: 'r3' }) as never);
      let ok: boolean | undefined;
      auth.renew().subscribe((v) => (ok = v));
      expect(http.get).toHaveBeenCalledWith(API.SESSION.RENEW);
      expect(store.refresh).toHaveBeenCalledWith('t3', 'r3');
      expect(ok).toBeTrue();
    });

    it('emits false when renewing fails', () => {
      http.get.and.returnValue(throwError(() => ({ status: 401 })) as never);
      let ok: boolean | undefined;
      auth.renew().subscribe((v) => (ok = v));
      expect(ok).toBeFalse();
    });
  });

  it('logout clears the session and goes to the login page', () => {
    auth.logout();
    expect(store.clear).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
