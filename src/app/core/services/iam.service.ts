import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import {
  PermissionCheckRequest,
  PermissionCheckResponse,
  TokenIntrospectResponse,
} from '@shared/models/iam.model';

@Injectable({ providedIn: 'root' })
export class IamService {
  private readonly http = inject(HttpService);

  introspectToken(token: string): Observable<TokenIntrospectResponse> {
    return this.http.post<TokenIntrospectResponse>(API.IAM.INTROSPECT, { token });
  }

  checkPermission(req: PermissionCheckRequest): Observable<PermissionCheckResponse> {
    return this.http.post<PermissionCheckResponse>(API.IAM.PERMISSION_CHECK, req);
  }
}
