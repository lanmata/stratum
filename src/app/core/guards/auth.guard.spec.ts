import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { SessionStoreService } from '@core/store/session/session.store.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  function run(platform: string, authenticated: boolean) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: platform },
        { provide: SessionStoreService, useValue: { isAuthenticated$: of(authenticated) } },
      ],
    });
    return TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  it('lets the server render without checking the session', () => {
    expect(run('server', false)).toBeTrue();
  });

  it('allows authenticated users in the browser', async () => {
    expect(await firstValueFrom(run('browser', true) as Observable<boolean | UrlTree>)).toBeTrue();
  });

  it('redirects anonymous users to the login page', async () => {
    const result = await firstValueFrom(run('browser', false) as Observable<boolean | UrlTree>);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/auth/login');
  });
});
