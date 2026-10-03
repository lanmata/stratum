import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { clearSession, saveSession } from './session.actions';
import { StorageMockService } from '@core/services/storage-mock.service';
import { decodeUserFromToken } from '@shared/utils/jwt.util';

@Injectable()
export class SessionEffects {
  private readonly actions$ = inject(Actions);
  private readonly storage = inject(StorageMockService);
  private readonly store = inject(Store);

  constructor() {
    this.rehydrateSession();
  }

  private rehydrateSession(): void {
    const token = this.storage.getItem('session_token');
    const refreshToken = this.storage.getItem('refresh_token');
    if (!token || !refreshToken) return;

    this.store.dispatch(saveSession({ token, refreshToken, user: decodeUserFromToken(token) }));
  }

  persistSession$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(saveSession),
        tap(({ token, refreshToken }) => {
          this.storage.setItem('session_token', token);
          this.storage.setItem('refresh_token', refreshToken);
        })
      ),
    { dispatch: false }
  );

  clearSession$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(clearSession),
        tap(() => {
          this.storage.removeItem('session_token');
          this.storage.removeItem('refresh_token');
        })
      ),
    { dispatch: false }
  );
}
