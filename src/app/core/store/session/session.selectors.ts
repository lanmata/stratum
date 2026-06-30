import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SessionState } from './session.state';

export const selectSessionState = createFeatureSelector<SessionState>('session');

export const selectToken = createSelector(selectSessionState, (state) => state.token);
export const selectRefreshToken = createSelector(selectSessionState, (state) => state.refreshToken);
export const selectUser = createSelector(selectSessionState, (state) => state.user);
export const selectIsAuthenticated = createSelector(
  selectSessionState,
  (state) => state.isAuthenticated
);
export const selectUserRoles = createSelector(selectUser, (user) => user?.roles ?? []);
