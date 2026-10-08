import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SILENT_ERRORS } from './http-context';
import { SessionStoreService } from '@core/store/session/session.store.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const session = inject(SessionStoreService);

  if (req.context.get(SILENT_ERRORS)) return next(req);

  return next(req).pipe(
    catchError((err) => {
      if (err.status === HttpStatusCode.Unauthorized) {
        session.clear();
        router.navigate(['/auth/login']);
      }
      if (err.status === HttpStatusCode.Forbidden) {
        router.navigate(['/forbidden']);
      }
      return throwError(() => err);
    })
  );
};
