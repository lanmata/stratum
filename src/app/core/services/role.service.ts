import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { Role, RoleRequest } from '@shared/models/role.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly http = inject(HttpService);

  getAll(includeInactive = false): Observable<Role[]> {
    return this.http.get<Role[]>(API.ROLES.WITH_INACTIVE(includeInactive));
  }

  getById(roleId: string): Observable<Role> {
    return this.http.get<Role>(API.ROLES.BY_ID(roleId));
  }

  getByUser(userId: string): Observable<Role[]> {
    return this.http.get<Role[]>(API.ROLES.BY_USER(userId));
  }

  create(req: RoleRequest): Observable<Role> {
    return this.http.post<Role>(`${API.ROLES.ROOT}/`, req);
  }

  update(roleId: string, req: RoleRequest): Observable<Role> {
    return this.http.put<Role>(`${API.ROLES.ROOT}/${roleId}`, req);
  }
}
