export interface SessionRequest {
  alias: string;
  password: string;
  applicationId: string;
}

export interface SessionEmailRequest {
  email: string;
  password: string;
}

export interface SessionRefreshRequest {
  refreshToken: string;
}

export interface SessionResponse {
  token: string;
  refreshToken: string;
}
