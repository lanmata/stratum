export interface TokenIntrospectRequest {
  token: string;
}

export interface TokenIntrospectResponse {
  active: boolean;
  subject?: string | null;
  issuer?: string | null;
  audience?: string | null;
  expiresAt?: number;
  issuedAt?: number;
  tokenType?: string | null;
  roles?: string[];
}

export interface PermissionCheckRequest {
  permission: string;
  sessionToken: string;
  applicationId?: string | null;
}

export interface PermissionCheckResponse {
  granted: boolean;
  permission: string;
  reason?: string | null;
}
