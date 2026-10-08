import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { Role, RoleRequest } from '@shared/models/role.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly http = inject(HttpService);

  getAll(): Observable<Role[]> {
    return this.http.getList<Role>(API.ROLES.ROOT);
  }

  getByStatus(includeInactive: boolean): Observable<Role[]> {
    return this.http.getList<Role>(API.ROLES.WITH_INACTIVE(includeInactive));
  }

  getByStatusAndIds(includeInactive: boolean, roleIds: string[]): Observable<Role[]> {
    if (roleIds.length === 0) return of([]);
    return this.http.getList<Role>(API.ROLES.BY_STATUS_AND_IDS(includeInactive, roleIds));
  }

  getById(roleId: string): Observable<Role> {
    return this.http.get<Role>(API.ROLES.BY_ID(roleId));
  }

  getByUser(userId: string): Observable<Role[]> {
    return this.http.getList<Role>(API.ROLES.BY_USER(userId));
  }

  getByApplication(applicationId: string): Observable<Role[]> {
    return this.http.getList<Role>(API.ROLES.BY_APPLICATION(applicationId));
  }

  create(req: RoleRequest): Observable<Role> {
    return this.http.post<Role>(`${API.ROLES.ROOT}/`, req);
  }

  update(roleId: string, req: RoleRequest): Observable<Role> {
    return this.http.put<Role>(API.ROLES.UPDATE(roleId), req);
  }
}
