import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { SessionStoreService } from '@core/store/session/session.store.service';

export const authGuard: CanActivateFn = () => {
  const store = inject(SessionStoreService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Session lives in localStorage, which the server can't see. Defer the
  // real check to the client (post-hydration), once SessionEffects has
  // rehydrated the store from storage.
  if (!isPlatformBrowser(platformId)) return true;

  return store.isAuthenticated$.pipe(
    take(1),
    map((isAuth) => (isAuth ? true : router.createUrlTree(['/auth/login'])))
  );
};
