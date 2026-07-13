import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import {
  ApplicationRoleUser,
  ApplicationRoleUserRequest,
} from '@shared/models/application-role-user.model';

@Injectable({ providedIn: 'root' })
export class ApplicationRoleUserService {
  private readonly http = inject(HttpService);

  getByApplication(applicationId: string): Observable<ApplicationRoleUser[]> {
    return this.http.get<ApplicationRoleUser[]>(API.APPLICATION_ROLE_USER.BY_APPLICATION(applicationId));
  }

  create(req: ApplicationRoleUserRequest): Observable<ApplicationRoleUser> {
    return this.http.post<ApplicationRoleUser>(API.APPLICATION_ROLE_USER.ROOT, req);
  }

  update(id: string, req: ApplicationRoleUserRequest): Observable<ApplicationRoleUser> {
    return this.http.put<ApplicationRoleUser>(API.APPLICATION_ROLE_USER.BY_ID(id), req);
  }

  delete(id: string): Observable<ApplicationRoleUser> {
    return this.http.delete<ApplicationRoleUser>(API.APPLICATION_ROLE_USER.BY_ID(id));
  }
}
