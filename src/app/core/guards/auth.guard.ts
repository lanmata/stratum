import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { SessionStoreService } from '@core/store/session/session.store.service';

export const authGuard: CanActivateFn = () => {
  const store = inject(SessionStoreService);
  const router = inject(Router);

  return store.isAuthenticated$.pipe(
    take(1),
    map((isAuth) => (isAuth ? true : router.createUrlTree(['/auth/login'])))
  );
};
