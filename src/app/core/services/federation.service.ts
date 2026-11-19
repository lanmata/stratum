import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import {
  FederationProvider,
  IdentityProvider,
  IdentityProviderRequest,
  LinkedIdentity,
} from '@shared/models/federation.model';
import { SessionResponse } from '@shared/models/session.model';

const BFF = '/bff/federation';

/**
 * Acceso social a través de backbone-rest. El flujo de acceso pasa por el BFF (`/bff/federation/*`): aquí solo se pide la lista de
 * proveedores, se navega al inicio del flujo y se cambia el ticket de un solo uso por la sesión. La administración de los
 * proveedores y de las cuentas enlazadas usa la API normal (`/api/v1/...`), decidida por backbone con la sesión del administrador.
 */
@Injectable({ providedIn: 'root' })
export class FederationService {
  private readonly http = inject(HttpService);
  private readonly client = inject(HttpClient);
  private readonly document = inject(DOCUMENT);

  /** Proveedores ofrecidos; vacío si la función está apagada. */
  loadProviders(): Observable<FederationProvider[]> {
    return this.client
      .get<{ enabled: boolean; providers: FederationProvider[] }>(`${BFF}/providers`)
      .pipe(map((response) => (response.enabled ? (response.providers ?? []) : [])));
  }

  /** Navega (página completa, no XHR) al inicio del flujo: el BFF redirige al proveedor. */
  signIn(provider: string, returnTo: string): void {
    this.document.location.assign(`${BFF}/${encodeURIComponent(provider)}/start?returnTo=${encodeURIComponent(returnTo)}`);
  }

  /** Cambia el ticket de un solo uso por la sesión (los tokens nunca viajan en una URL). */
  exchange(ticket: string): Observable<SessionResponse> {
    return this.client.post<SessionResponse>(`${BFF}/exchange`, { ticket });
  }

  listProviders(applicationId: string): Observable<IdentityProvider[]> {
    return this.http.get<IdentityProvider[]>(API.FEDERATION.PROVIDERS, { applicationId });
  }

  createProvider(request: IdentityProviderRequest): Observable<IdentityProvider> {
    return this.http.post<IdentityProvider>(API.FEDERATION.PROVIDERS, request);
  }

  updateProvider(id: string, request: IdentityProviderRequest): Observable<IdentityProvider> {
    return this.http.put<IdentityProvider>(API.FEDERATION.PROVIDER(id), request);
  }

  deleteProvider(id: string): Observable<void> {
    return this.http.delete<void>(API.FEDERATION.PROVIDER(id));
  }

  identities(userId: string): Observable<LinkedIdentity[]> {
    return this.http.get<LinkedIdentity[]>(API.FEDERATION.IDENTITIES(userId));
  }

  unlink(userId: string, identityId: string): Observable<void> {
    return this.http.delete<void>(API.FEDERATION.IDENTITY(userId, identityId));
  }
}
