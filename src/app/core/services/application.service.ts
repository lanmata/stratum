import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import {
  Application,
  ApplicationCreateRequest,
  ApplicationCreateResponse,
  ApplicationUpdateRequest,
} from '@shared/models/application.model';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private readonly http = inject(HttpService);

  getAll(): Observable<Application[]> {
    return this.http.getList<Application>(API.APPLICATIONS.ROOT);
  }

  getByIds(ids: string[]): Observable<Application[]> {
    if (ids.length === 0) return of([]);
    return this.http.getList<Application>(API.APPLICATIONS.ROOT, { ids: ids.join(',') });
  }

  getById(id: string): Observable<Application> {
    return this.http.get<Application>(API.APPLICATIONS.BY_ID(id));
  }

  create(req: ApplicationCreateRequest): Observable<ApplicationCreateResponse> {
    return this.http.post<ApplicationCreateResponse>(API.APPLICATIONS.ROOT, req);
  }

  update(id: string, req: ApplicationUpdateRequest): Observable<Application> {
    return this.http.put<Application>(API.APPLICATIONS.BY_ID(id), req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(API.APPLICATIONS.BY_ID(id));
  }
}
