import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { RoleFeature, RoleFeatureRequest } from '@shared/models/role-feature.model';

@Injectable({ providedIn: 'root' })
export class RoleFeatureService {
  private readonly http = inject(HttpService);

  getByRole(roleId: string): Observable<RoleFeature[]> {
    return this.http.get<RoleFeature[]>(API.ROLE_FEATURES.BY_ROLE(roleId));
  }

  create(req: RoleFeatureRequest): Observable<RoleFeature> {
    return this.http.post<RoleFeature>(API.ROLE_FEATURES.ROOT, req);
  }

  update(id: string, req: RoleFeatureRequest): Observable<RoleFeature> {
    return this.http.put<RoleFeature>(API.ROLE_FEATURES.BY_ID(id), req);
  }

  delete(id: string): Observable<RoleFeature> {
    return this.http.delete<RoleFeature>(API.ROLE_FEATURES.BY_ID(id));
  }
}
