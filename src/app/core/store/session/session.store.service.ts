import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { UserTO } from '@shared/models/user.model';
import { clearSession, refreshSession, saveSession } from './session.actions';
import {
  selectIsAuthenticated,
  selectToken,
  selectUser,
  selectUserRoles,
} from './session.selectors';
import { Role } from '@shared/models/role.model';

@Injectable({ providedIn: 'root' })
export class SessionStoreService {
  private readonly store = inject(Store);

  readonly token$: Observable<string | null> = this.store.select(selectToken);
  readonly user$: Observable<UserTO | null> = this.store.select(selectUser);
  readonly isAuthenticated$: Observable<boolean> = this.store.select(selectIsAuthenticated);
  readonly userRoles$: Observable<Role[]> = this.store.select(selectUserRoles);

  save(token: string, refreshToken: string, user: UserTO): void {
    this.store.dispatch(saveSession({ token, refreshToken, user }));
  }

  refresh(token: string, refreshToken: string): void {
    this.store.dispatch(refreshSession({ token, refreshToken }));
  }

  clear(): void {
    this.store.dispatch(clearSession());
  }
}
