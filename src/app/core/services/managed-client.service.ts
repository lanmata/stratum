import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import {
  ManagedClientTO,
  ManagedClientCreateRequest,
  ManagedClientCreateResponse,
  ManagedClientUpdateRequest,
  ManagedClientSecretRotateResponse,
  ManagedClientTokenRequest,
  ManagedClientTokenResponse,
  ManagedClientTokenIntrospectResponse,
} from '@shared/models/managed-client.model';

@Injectable({ providedIn: 'root' })
export class ManagedClientService {
  private readonly http = inject(HttpService);

  list(applicationId?: string): Observable<ManagedClientTO[]> {
    const params = applicationId ? `?applicationId=${applicationId}` : '';
    return this.http.get<ManagedClientTO[]>(`${API.MANAGED_CLIENTS.ROOT}${params}`);
  }

  getById(clientId: string): Observable<ManagedClientTO> {
    return this.http.get<ManagedClientTO>(API.MANAGED_CLIENTS.BY_ID(clientId));
  }

  create(req: ManagedClientCreateRequest): Observable<ManagedClientCreateResponse> {
    return this.http.post<ManagedClientCreateResponse>(API.MANAGED_CLIENTS.ROOT, req);
  }

  update(clientId: string, req: ManagedClientUpdateRequest): Observable<ManagedClientTO> {
    return this.http.put<ManagedClientTO>(API.MANAGED_CLIENTS.BY_ID(clientId), req);
  }

  delete(clientId: string): Observable<void> {
    return this.http.delete<void>(API.MANAGED_CLIENTS.BY_ID(clientId));
  }

  rotateSecret(clientId: string): Observable<ManagedClientSecretRotateResponse> {
    return this.http.post<ManagedClientSecretRotateResponse>(
      API.MANAGED_CLIENTS.ROTATE_SECRET(clientId),
      {}
    );
  }

  issueToken(req: ManagedClientTokenRequest): Observable<ManagedClientTokenResponse> {
    return this.http.post<ManagedClientTokenResponse>(API.MANAGED_CLIENTS.TOKEN, req);
  }

  introspectToken(token: string): Observable<ManagedClientTokenIntrospectResponse> {
    return this.http.post<ManagedClientTokenIntrospectResponse>(API.MANAGED_CLIENTS.INTROSPECT, {
      token,
    });
  }

  revokeAllTokens(clientId: string): Observable<void> {
    return this.http.delete<void>(API.MANAGED_CLIENTS.REVOKE_TOKENS(clientId));
  }
}
