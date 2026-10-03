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
