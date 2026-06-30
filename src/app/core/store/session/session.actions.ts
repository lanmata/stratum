import { createAction, props } from '@ngrx/store';
import { UserTO } from '@shared/models/user.model';

export const saveSession = createAction(
  '[Session] Save Session',
  props<{ token: string; refreshToken: string; user: UserTO }>()
);

export const clearSession = createAction('[Session] Clear Session');

export const refreshSession = createAction(
  '[Session] Refresh Session',
  props<{ token: string; refreshToken: string }>()
);
