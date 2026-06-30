import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((err) => {
      if (err.status === HttpStatusCode.Unauthorized) {
        router.navigate(['/auth/login']);
      }
      if (err.status === HttpStatusCode.Forbidden) {
        router.navigate(['/forbidden']);
      }
      return throwError(() => err);
    })
  );
};
