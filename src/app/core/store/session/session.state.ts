import { UserTO } from '@shared/models/user.model';

export interface SessionState {
  token: string | null;
  refreshToken: string | null;
  user: UserTO | null;
  isAuthenticated: boolean;
}

export const initialSessionState: SessionState = {
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
};
