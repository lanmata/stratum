import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap, map, catchError, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { HttpService } from './http.service';
import { SessionStoreService } from '@core/store/session/session.store.service';
import { API } from '@shared/constants/api.constants';
import { SessionRequest, SessionEmailRequest, SessionRefreshRequest, SessionResponse } from '@shared/models/session.model';
import { decodeUserFromToken } from '@shared/utils/jwt.util';

const AUTH_FAILURE_STATUSES = [400, 401, 403, 404];

function falseOnAuthFailure(error: { status?: number }): Observable<boolean> {
  return AUTH_FAILURE_STATUSES.includes(error?.status ?? 0) ? of(false) : throwError(() => error);
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpService);
  private readonly store = inject(SessionStoreService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);

  loginWithAlias(credentials: SessionRequest): Observable<boolean> {
    this.isLoading.set(true);
    return this.http.post<SessionResponse>(API.SESSION.ROOT, credentials).pipe(
      tap((res) => this.handleSessionResponse(res, credentials.alias)),
      map(() => true),
      catchError(() => of(false)),
      tap(() => this.isLoading.set(false))
    );
  }

  loginWithEmail(credentials: SessionEmailRequest): Observable<boolean> {
    this.isLoading.set(true);
    return this.http.post<SessionResponse>(API.SESSION.TOKEN, credentials).pipe(
      tap((res) => this.handleSessionResponse(res)),
      map(() => true),
      catchError(() => of(false)),
      tap(() => this.isLoading.set(false))
    );
  }

  refresh(req: SessionRefreshRequest): Observable<boolean> {
    return this.http.post<SessionResponse>(API.SESSION.REFRESH, req).pipe(
      tap((res) => this.store.refresh(res.token, res.refreshToken)),
      map(() => true),
      catchError(falseOnAuthFailure)
    );
  }

  validate(): Observable<boolean> {
    return this.http.get<boolean>(API.SESSION.VALIDATE).pipe(
      map((valid) => valid === true),
      catchError(falseOnAuthFailure)
    );
  }

  renew(): Observable<boolean> {
    return this.http.get<SessionResponse>(API.SESSION.RENEW).pipe(
      tap((res) => this.store.refresh(res.token, res.refreshToken)),
      map(() => true),
      catchError(falseOnAuthFailure)
    );
  }

  logout(): void {
    this.store.clear();
    this.router.navigate(['/auth/login']);
  }

  private handleSessionResponse(res: SessionResponse, alias?: string): void {
    const decoded = decodeUserFromToken(res.token);
    const user = alias ? { ...decoded, alias } : decoded;
    this.store.save(res.token, res.refreshToken, user);
  }
}
