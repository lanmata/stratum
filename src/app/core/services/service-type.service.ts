import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { ServiceType, ServiceTypeRequest } from '@shared/models/service-type.model';

@Injectable({ providedIn: 'root' })
export class ServiceTypeService {
  private readonly http = inject(HttpService);

  getAll(): Observable<ServiceType[]> {
    return this.http.get<ServiceType[]>(API.SERVICE_TYPES.LIST_ALL);
  }

  getById(id: string): Observable<ServiceType> {
    return this.http.get<ServiceType>(API.SERVICE_TYPES.BY_ID(id));
  }

  create(req: ServiceTypeRequest): Observable<ServiceType> {
    return this.http.post<ServiceType>(API.SERVICE_TYPES.ROOT, req);
  }

  update(id: string, req: ServiceTypeRequest): Observable<ServiceType> {
    return this.http.put<ServiceType>(API.SERVICE_TYPES.BY_ID(id), req);
  }

  delete(id: string): Observable<ServiceType> {
    return this.http.delete<ServiceType>(API.SERVICE_TYPES.BY_ID(id));
  }
}
