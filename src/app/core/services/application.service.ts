import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
    return this.http.get<Application[]>(API.APPLICATIONS.ROOT);
  }

  create(req: ApplicationCreateRequest): Observable<ApplicationCreateResponse> {
    return this.http.post<ApplicationCreateResponse>(API.APPLICATIONS.ROOT, req);
  }

  update(id: string, req: ApplicationUpdateRequest): Observable<Application> {
    return this.http.put<Application>(API.APPLICATIONS.BY_ID(id), req);
  }
}
