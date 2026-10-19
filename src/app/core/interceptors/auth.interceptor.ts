import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '@env/environment';
import { StorageMockService } from '@core/services/storage-mock.service';
import { API, SESSION_TOKEN_HEADER } from '@shared/constants/api.constants';

const UNAUTHENTICATED_PATHS = new Set([
  `${environment.apiBaseUrl}${API.SESSION.ROOT}`,
  `${environment.apiBaseUrl}${API.SESSION.TOKEN}`,
]);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageMockService);

  if (UNAUTHENTICATED_PATHS.has(req.url)) return next(req);

  const token = storage.getItem('session_token');
  if (!token) return next(req);

  return next(req.clone({ headers: req.headers.set(SESSION_TOKEN_HEADER, token) }));
};
