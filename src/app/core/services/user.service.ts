import { inject, Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { UserTO, UserCreateRequest, UserCreateResponse, PutUserUpdateRequest } from '@shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpService);

  create(req: UserCreateRequest): Observable<HttpResponse<UserCreateResponse>> {
    return this.http.postWithResponse<UserCreateResponse>(API.USERS.ROOT, req);
  }

  getById(userId: string): Observable<UserTO> {
    return this.http.get<UserTO>(API.USERS.BY_ID(userId));
  }

  getByApplication(applicationId: string): Observable<UserTO[]> {
    return this.http.get<UserTO[]>(API.USERS.BY_APPLICATION(applicationId));
  }

  getByAlias(alias: string, applicationId: string): Observable<UserTO> {
    return this.http.get<UserTO>(API.USERS.BY_ALIAS(alias, applicationId));
  }

  checkAlias(alias: string, applicationId: string): Observable<void> {
    return this.http.get<void>(API.USERS.CHECK_ALIAS(alias, applicationId));
  }

  checkEmail(email: string, applicationId: string): Observable<void> {
    return this.http.get<void>(API.USERS.CHECK_EMAIL(email, applicationId));
  }

  updateFull(userId: string, user: UserTO): Observable<UserTO> {
    return this.http.put<UserTO>(API.USERS.FULL_DETAIL(userId), user);
  }

  update(userId: string, req: PutUserUpdateRequest): Observable<void> {
    return this.http.put<void>(`${API.USERS.ROOT}/${userId}`, req);
  }

  linkRole(userId: string, roleId: string): Observable<UserTO> {
    return this.http.put<UserTO>(API.USERS.LINK_ROLE(userId, roleId), {});
  }

  unlinkRole(userId: string, roleId: string): Observable<UserTO> {
    return this.http.put<UserTO>(API.USERS.UNLINK_ROLE(userId, roleId), {});
  }

  delete(applicationId: string, userId: string): Observable<void> {
    return this.http.delete<void>(API.USERS.DELETE(applicationId, userId));
  }
}
