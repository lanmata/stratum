import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageMockService } from '@core/services/storage-mock.service';
import { SESSION_TOKEN_HEADER } from '@shared/constants/api.constants';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageMockService);
  const token = storage.getItem('session_token');

  if (!token) return next(req);

  return next(
    req.clone({
      headers: req.headers.set(SESSION_TOKEN_HEADER, token),
    })
  );
};
