import { TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { firstValueFrom, of, ReplaySubject } from 'rxjs';
import { Action } from '@ngrx/store';
import { StorageMockService } from '@core/services/storage-mock.service';
import { UserTO } from '@shared/models/user.model';
import { clearSession, refreshSession, saveSession } from './session.actions';
import { SessionEffects } from './session.effects';
import { sessionReducer } from './session.reducer';
import {
  selectIsAuthenticated,
  selectRefreshToken,
  selectSessionState,
  selectToken,
  selectUser,
  selectUserRoles,
} from './session.selectors';
import { initialSessionState } from './session.state';
import { SessionStoreService } from './session.store.service';

const user: UserTO = {
  id: 'u1',
  alias: 'ana',
  email: 'a@b.c',
  displayName: 'Ana',
  active: true,
  notificationEmail: false,
  notificationSms: false,
  privacyDataOutActive: false,
  roles: [{ id: 'r1', name: 'ADMIN', active: true }],
};

describe('session reducer', () => {
  it('starts unauthenticated', () => {
    expect(sessionReducer(undefined, { type: 'noop' })).toEqual(initialSessionState);
  });

  it('saves a session', () => {
    const state = sessionReducer(initialSessionState, saveSession({ token: 't', refreshToken: 'r', user }));
    expect(state).toEqual({ token: 't', refreshToken: 'r', user, isAuthenticated: true });
  });

  it('refreshes only the tokens', () => {
    const saved = sessionReducer(initialSessionState, saveSession({ token: 't', refreshToken: 'r', user }));
    const state = sessionReducer(saved, refreshSession({ token: 't2', refreshToken: 'r2' }));
    expect(state).toEqual({ token: 't2', refreshToken: 'r2', user, isAuthenticated: true });
  });

  it('clears the session', () => {
    const saved = sessionReducer(initialSessionState, saveSession({ token: 't', refreshToken: 'r', user }));
    expect(sessionReducer(saved, clearSession())).toEqual(initialSessionState);
  });
});

describe('session selectors', () => {
  const state = { session: { token: 't', refreshToken: 'r', user, isAuthenticated: true } };

  it('selects every slice', () => {
    expect(selectSessionState(state)).toBe(state.session);
    expect(selectToken(state)).toBe('t');
    expect(selectRefreshToken(state)).toBe('r');
    expect(selectUser(state)).toBe(user);
    expect(selectIsAuthenticated(state)).toBeTrue();
    expect(selectUserRoles(state)).toEqual(user.roles!);
  });

  it('returns no roles without a user or roles', () => {
    expect(selectUserRoles({ session: initialSessionState })).toEqual([]);
    expect(selectUserRoles({ session: { ...initialSessionState, user: { ...user, roles: undefined } } })).toEqual([]);
  });
});

describe('SessionStoreService', () => {
  let facade: SessionStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideStore({ session: sessionReducer })] });
    facade = TestBed.inject(SessionStoreService);
  });

  it('exposes the session through observables and dispatches changes', async () => {
    expect(await firstValueFrom(facade.isAuthenticated$)).toBeFalse();
    facade.save('t', 'r', user);
    expect(await firstValueFrom(facade.token$)).toBe('t');
    expect(await firstValueFrom(facade.refreshToken$)).toBe('r');
    expect(await firstValueFrom(facade.user$)).toEqual(user);
    expect(await firstValueFrom(facade.userRoles$)).toEqual(user.roles!);
    expect(await firstValueFrom(facade.isAuthenticated$)).toBeTrue();
    facade.refresh('t2', 'r2');
    expect(await firstValueFrom(facade.token$)).toBe('t2');
    facade.clear();
    expect(await firstValueFrom(facade.isAuthenticated$)).toBeFalse();
  });
});

describe('SessionEffects', () => {
  let actions$: ReplaySubject<Action>;
  let storage: jasmine.SpyObj<StorageMockService>;
  let store: jasmine.SpyObj<Store>;

  function setup(stored: Record<string, string> = {}) {
    TestBed.resetTestingModule();
    actions$ = new ReplaySubject<Action>(1);
    storage = jasmine.createSpyObj('StorageMockService', ['getItem', 'setItem', 'removeItem']);
    storage.getItem.and.callFake((k: string) => stored[k] ?? null);
    store = jasmine.createSpyObj('Store', ['dispatch']);
    TestBed.configureTestingModule({
      providers: [
        SessionEffects,
        provideMockActions(() => actions$),
        { provide: StorageMockService, useValue: storage },
        { provide: Store, useValue: store },
      ],
    });
    return TestBed.inject(SessionEffects);
  }

  function dispatched(): ReturnType<typeof saveSession> {
    return (store.dispatch as unknown as jasmine.Spy).calls.mostRecent().args[0];
  }

  function jwt(payload: object): string {
    return `h.${btoa(JSON.stringify(payload))}.s`;
  }

  it('does not rehydrate without stored tokens', () => {
    setup();
    expect(store.dispatch).not.toHaveBeenCalled();
    setup({ session_token: 't' });
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('rehydrates from storage using the token alias', () => {
    const token = jwt({ sub: 'u1', alias: 'ana' });
    setup({ session_token: token, refresh_token: 'r' });
    const action = dispatched();
    expect(action.type).toBe(saveSession.type);
    expect(action.token).toBe(token);
    expect(action.refreshToken).toBe('r');
    expect(action.user.alias).toBe('ana');
  });

  it('falls back to the stored alias when the token has none', () => {
    setup({ session_token: jwt({ sub: 'u1' }), refresh_token: 'r', session_alias: 'stored' });
    const action = dispatched();
    expect(action.user.alias).toBe('stored');
  });

  it('uses an empty alias when nothing provides one', () => {
    setup({ session_token: jwt({ sub: 'u1' }), refresh_token: 'r' });
    const action = dispatched();
    expect(action.user.alias).toBe('');
  });

  it('persists a saved session', () => {
    const effects = setup();
    effects.persistSession$.subscribe();
    actions$.next(saveSession({ token: 't', refreshToken: 'r', user }));
    expect(storage.setItem).toHaveBeenCalledWith('session_token', 't');
    expect(storage.setItem).toHaveBeenCalledWith('refresh_token', 'r');
    expect(storage.setItem).toHaveBeenCalledWith('session_alias', 'ana');
  });

  it('does not store an empty alias', () => {
    const effects = setup();
    effects.persistSession$.subscribe();
    actions$.next(saveSession({ token: 't', refreshToken: 'r', user: { ...user, alias: '' } }));
    expect(storage.setItem).not.toHaveBeenCalledWith('session_alias', jasmine.anything());
  });

  it('persists refreshed tokens so the interceptor uses the new one', () => {
    const effects = setup();
    effects.persistRefresh$.subscribe();
    actions$.next(refreshSession({ token: 't2', refreshToken: 'r2' }));
    expect(storage.setItem).toHaveBeenCalledWith('session_token', 't2');
    expect(storage.setItem).toHaveBeenCalledWith('refresh_token', 'r2');
  });

  it('removes the stored session on clear', () => {
    const effects = setup();
    effects.clearSession$.subscribe();
    actions$.next(clearSession());
    expect(storage.removeItem).toHaveBeenCalledWith('session_token');
    expect(storage.removeItem).toHaveBeenCalledWith('refresh_token');
    expect(storage.removeItem).toHaveBeenCalledWith('session_alias');
  });

  it('ignores unrelated actions', () => {
    const effects = setup();
    effects.persistSession$.subscribe();
    actions$.next({ type: 'other' });
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(of(1)).toBeTruthy();
  });
});
