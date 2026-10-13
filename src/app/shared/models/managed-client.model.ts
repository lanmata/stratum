export interface ManagedClientTO {
  clientId: string;
  name: string;
  description?: string;
  applicationId: string;
  scopes: string[];
  active: boolean;
  createdAt?: string;
  lastUpdatedAt?: string;
  secretLastRotatedAt?: string;
}

export interface ManagedClientCreateRequest {
  name: string;
  applicationId: string;
  scopes: string[];
  description?: string;
  active?: boolean;
}

export interface ManagedClientCreateResponse {
  clientId: string;
  clientSecret: string;
  name: string;
  applicationId: string;
  scopes: string[];
  active: boolean;
  createdAt?: string;
}

export interface ManagedClientUpdateRequest {
  name?: string;
  description?: string;
  scopes?: string[];
  active?: boolean;
}

export interface ManagedClientSecretRotateResponse {
  clientId: string;
  clientSecret: string;
  gracePeriodSeconds?: number;
  rotatedAt?: string;
}

export interface ManagedClientTokenRequest {
  clientId: string;
  clientSecret: string;
  scopes: string[];
}

export interface ManagedClientTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  scopes: string[];
  issuedAt?: string;
}

export interface ManagedClientTokenIntrospectResponse {
  active: boolean;
  clientId?: string;
  clientName?: string;
  scopes?: string[];
  issuer?: string;
  exp?: number;
  iat?: number;
  jti?: string;
}
