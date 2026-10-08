import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { SessionStoreService } from '@core/store/session/session.store.service';
import { getTokenExpiry } from '@shared/utils/jwt.util';

export const RENEW_SKEW_MS = 60_000;
export const MIN_DELAY_MS = 5_000;
export const RETRY_DELAY_MS = 30_000;
const MAX_TIMER_MS = 2 ** 31 - 1;

@Injectable({ providedIn: 'root' })
export class SessionKeepAliveService {
  private readonly auth = inject(AuthService);
  private readonly store = inject(SessionStoreService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  private timer: ReturnType<typeof setTimeout> | null = null;
  private started = false;

  start(): void {
    if (this.started || !isPlatformBrowser(this.platformId)) return;
    this.started = true;

    this.store.token$.subscribe((token) => this.schedule(token));

    this.store.token$.pipe(take(1)).subscribe((token) => {
      if (token) this.revalidate();
    });
  }

  stop(): void {
    this.clearTimer();
    this.started = false;
  }

  private revalidate(): void {
    this.auth
      .validate()
      .pipe(switchMap((valid) => (valid ? of(true) : this.refreshWithToken())))
      .subscribe({
        next: (ok) => {
          if (!ok) this.discardStaleSession();
        },
        error: () => this.retryLater(),
      });
  }

  private schedule(token: string | null): void {
    this.clearTimer();
    if (!token) return;
    const expiry = getTokenExpiry(token);
    if (expiry === null) return;

    const delay = Math.min(Math.max(expiry - Date.now() - RENEW_SKEW_MS, MIN_DELAY_MS), MAX_TIMER_MS);
    this.arm(delay, () =>
      this.refreshSession().subscribe({
        next: (ok) => {
          if (!ok) this.expire();
        },
        error: () => this.retryLater(),
      }),
    );
  }

  // A pending timer inside the Angular zone keeps the app "unstable", which stalls SSR
  // hydration (NG0506); wait outside the zone and re-enter it only when the timer fires.
  private arm(delay: number, action: () => void): void {
    this.timer = this.zone.runOutsideAngular(() =>
      setTimeout(() => this.zone.run(action), delay),
    );
  }

  // The backend being unreachable is not a reason to drop the session: try again later.
  private retryLater(): void {
    this.clearTimer();
    this.arm(RETRY_DELAY_MS, () => this.revalidate());
  }

  private refreshSession(): Observable<boolean> {
    return this.refreshWithToken().pipe(switchMap((ok) => (ok ? of(true) : this.auth.renew())));
  }

  // renew needs a still-valid session token, so it is only a fallback for a live session.
  private refreshWithToken(): Observable<boolean> {
    return this.store.refreshToken$.pipe(
      take(1),
      switchMap((refreshToken) => (refreshToken ? this.auth.refresh({ refreshToken }) : of(false)))
    );
  }

  private discardStaleSession(): void {
    this.clearTimer();
    this.store.clear();
    if (!this.router.url.startsWith('/auth')) this.router.navigate(['/auth/login']);
  }

  private expire(): void {
    this.clearTimer();
    this.toast.warning('Tu sesión expiró. Inicia sesión nuevamente.');
    this.auth.logout();
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
