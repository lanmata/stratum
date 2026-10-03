import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap, map, catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import { HttpService } from './http.service';
import { SessionStoreService } from '@core/store/session/session.store.service';
import { API } from '@shared/constants/api.constants';
import { SessionRequest, SessionEmailRequest, SessionRefreshRequest, SessionResponse } from '@shared/models/session.model';
import { decodeUserFromToken } from '@shared/utils/jwt.util';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpService);
  private readonly store = inject(SessionStoreService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);

  loginWithAlias(credentials: SessionRequest): Observable<boolean> {
    this.isLoading.set(true);
    return this.http.post<SessionResponse>(API.SESSION.ROOT, credentials).pipe(
      tap((res) => this.handleSessionResponse(res)),
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
      catchError(() => of(false))
    );
  }

  logout(): void {
    this.store.clear();
    this.router.navigate(['/auth/login']);
  }

  private handleSessionResponse(res: SessionResponse): void {
    const user = decodeUserFromToken(res.token);
    this.store.save(res.token, res.refreshToken, user);
  }
}
