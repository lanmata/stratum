import { createReducer, on } from '@ngrx/store';
import { initialSessionState } from './session.state';
import { clearSession, refreshSession, saveSession } from './session.actions';

export const sessionReducer = createReducer(
  initialSessionState,
  on(saveSession, (_state, { token, refreshToken, user }) => ({
    token,
    refreshToken,
    user,
    isAuthenticated: true,
  })),
  on(refreshSession, (state, { token, refreshToken }) => ({
    ...state,
    token,
    refreshToken,
  })),
  on(clearSession, () => initialSessionState)
);
