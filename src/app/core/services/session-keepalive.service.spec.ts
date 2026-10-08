import { PLATFORM_ID } from '@angular/core';
import { fakeAsync, TestBed, tick, discardPeriodicTasks } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { SessionStoreService } from '@core/store/session/session.store.service';
import { AuthService } from './auth.service';
import { MIN_DELAY_MS, RENEW_SKEW_MS, RETRY_DELAY_MS, SessionKeepAliveService } from './session-keepalive.service';
import { ToastService } from './toast.service';

function jwtExpiringIn(ms: number): string {
  return `h.${btoa(JSON.stringify({ exp: Math.floor((Date.now() + ms) / 1000) }))}.s`;
}

describe('SessionKeepAliveService', () => {
  let token$: BehaviorSubject<string | null>;
  let refreshToken$: BehaviorSubject<string | null>;
  let auth: jasmine.SpyObj<AuthService>;
  let toast: jasmine.SpyObj<ToastService>;
  let store: jasmine.SpyObj<{ clear(): void }> & { token$: BehaviorSubject<string | null>; refreshToken$: BehaviorSubject<string | null> };
  let router: { url: string; navigate: jasmine.Spy };

  function create(platform = 'browser'): SessionKeepAliveService {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: ToastService, useValue: toast },
        { provide: SessionStoreService, useValue: store },
        { provide: Router, useValue: router },
        { provide: PLATFORM_ID, useValue: platform },
      ],
    });
    return TestBed.inject(SessionKeepAliveService);
  }

  beforeEach(() => {
    token$ = new BehaviorSubject<string | null>(null);
    refreshToken$ = new BehaviorSubject<string | null>('rt');
    auth = jasmine.createSpyObj('AuthService', ['validate', 'refresh', 'renew', 'logout']);
    auth.validate.and.returnValue(of(true));
    auth.refresh.and.returnValue(of(true));
    auth.renew.and.returnValue(of(true));
    toast = jasmine.createSpyObj('ToastService', ['warning']);
    store = Object.assign(jasmine.createSpyObj('SessionStoreService', ['clear']), { token$, refreshToken$ });
    router = { url: '/dashboard', navigate: jasmine.createSpy('navigate') };
  });

  it('does nothing on the server', () => {
    const svc = create('server');
    token$.next(jwtExpiringIn(600_000));
    svc.start();
    expect(auth.validate).not.toHaveBeenCalled();
  });

  it('does not validate when there is no session at startup', () => {
    create().start();
    expect(auth.validate).not.toHaveBeenCalled();
  });

  it('only starts once', () => {
    const svc = create();
    token$.next(jwtExpiringIn(600_000));
    svc.start();
    svc.start();
    expect(auth.validate).toHaveBeenCalledTimes(1);
    svc.stop();
  });

  it('validates the stored session at startup and keeps it when valid', () => {
    token$.next(jwtExpiringIn(600_000));
    const svc = create();
    svc.start();
    expect(auth.validate).toHaveBeenCalled();
    expect(auth.refresh).not.toHaveBeenCalled();
    expect(auth.logout).not.toHaveBeenCalled();
    svc.stop();
  });

  it('refreshes an invalid session at startup', () => {
    auth.validate.and.returnValue(of(false));
    token$.next(jwtExpiringIn(600_000));
    const svc = create();
    svc.start();
    expect(auth.refresh).toHaveBeenCalledWith({ refreshToken: 'rt' });
    expect(auth.logout).not.toHaveBeenCalled();
    svc.stop();
  });

  it('does not try to renew a session that validate rejected', () => {
    auth.validate.and.returnValue(of(false));
    auth.refresh.and.returnValue(of(false));
    token$.next(jwtExpiringIn(600_000));
    const svc = create();
    svc.start();
    expect(auth.renew).not.toHaveBeenCalled();
    svc.stop();
  });

  it('silently discards the stale session and goes to login when nothing can refresh it', () => {
    auth.validate.and.returnValue(of(false));
    refreshToken$.next(null);
    token$.next(jwtExpiringIn(600_000));
    const svc = create();
    svc.start();
    expect(auth.refresh).not.toHaveBeenCalled();
    expect(auth.renew).not.toHaveBeenCalled();
    expect(store.clear).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    expect(toast.warning).not.toHaveBeenCalled();
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('does not navigate when the user is already on the login page', () => {
    router.url = '/auth/login';
    auth.validate.and.returnValue(of(false));
    auth.refresh.and.returnValue(of(false));
    token$.next(jwtExpiringIn(600_000));
    const svc = create();
    svc.start();
    expect(store.clear).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('expires the live session with a warning when the scheduled renewal fails', fakeAsync(() => {
    auth.refresh.and.returnValue(of(false));
    auth.renew.and.returnValue(of(false));
    const svc = create();
    svc.start();
    token$.next(jwtExpiringIn(10_000));
    tick(MIN_DELAY_MS + 1);
    expect(auth.renew).toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalled();
    expect(auth.logout).toHaveBeenCalled();
  }));

  it('refreshes shortly before the token expires', fakeAsync(() => {
    const svc = create();
    svc.start();
    token$.next(jwtExpiringIn(5 * 60_000));
    tick(5 * 60_000 - RENEW_SKEW_MS - 2_000);
    expect(auth.refresh).not.toHaveBeenCalled();
    tick(3_000);
    expect(auth.refresh).toHaveBeenCalledWith({ refreshToken: 'rt' });
    svc.stop();
  }));

  it('waits at least the minimum delay for tokens that are about to expire', fakeAsync(() => {
    const svc = create();
    svc.start();
    token$.next(jwtExpiringIn(1_000));
    tick(MIN_DELAY_MS - 1);
    expect(auth.refresh).not.toHaveBeenCalled();
    tick(2);
    expect(auth.refresh).toHaveBeenCalled();
    svc.stop();
  }));

  it('logs out when the scheduled refresh fails', fakeAsync(() => {
    auth.refresh.and.returnValue(of(false));
    auth.renew.and.returnValue(of(false));
    const svc = create();
    svc.start();
    token$.next(jwtExpiringIn(10_000));
    tick(MIN_DELAY_MS + 1);
    expect(auth.logout).toHaveBeenCalled();
    svc.stop();
  }));

  it('does not schedule for tokens without expiry and cancels on logout', fakeAsync(() => {
    const svc = create();
    svc.start();
    token$.next('h.' + btoa('{}') + '.s');
    tick(10 * 60_000);
    expect(auth.refresh).not.toHaveBeenCalled();

    token$.next(jwtExpiringIn(60_000 + MIN_DELAY_MS + 1_000));
    token$.next(null);
    tick(10 * 60_000);
    expect(auth.refresh).not.toHaveBeenCalled();
    svc.stop();
    discardPeriodicTasks();
  }));

  it('keeps the session and retries later when the backend is unreachable', fakeAsync(() => {
    auth.validate.and.returnValues(throwError(() => ({ status: 502 })), of(true));
    token$.next(jwtExpiringIn(600_000));
    const svc = create();
    svc.start();
    expect(auth.logout).not.toHaveBeenCalled();
    tick(RETRY_DELAY_MS);
    expect(auth.validate).toHaveBeenCalledTimes(2);
    expect(auth.logout).not.toHaveBeenCalled();
    svc.stop();
  }));

  it('keeps the session when the scheduled refresh hits an outage', fakeAsync(() => {
    auth.refresh.and.returnValue(throwError(() => ({ status: 502 })));
    const svc = create();
    svc.start();
    token$.next(jwtExpiringIn(10_000));
    tick(MIN_DELAY_MS + 1);
    expect(auth.logout).not.toHaveBeenCalled();
    svc.stop();
  }));

  it('stop() cancels the pending refresh', fakeAsync(() => {
    const svc = create();
    svc.start();
    token$.next(jwtExpiringIn(10_000));
    svc.stop();
    tick(10 * 60_000);
    expect(auth.refresh).not.toHaveBeenCalled();
  }));
});
