import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { Feature, FeatureRequest } from '@shared/models/feature.model';

@Injectable({ providedIn: 'root' })
export class FeatureService {
  private readonly http = inject(HttpService);

  getAll(includeInactive = false): Observable<Feature[]> {
    return this.http.getList<Feature>(API.FEATURES.WITH_INACTIVE(includeInactive));
  }

  getByStatusAndIds(includeInactive: boolean, featureIds: string[]): Observable<Feature[]> {
    if (featureIds.length === 0) return of([]);
    return this.http.getList<Feature>(API.FEATURES.BY_STATUS_AND_IDS(includeInactive, featureIds));
  }

  getById(featureId: string): Observable<Feature> {
    return this.http.get<Feature>(API.FEATURES.BY_ID(featureId));
  }

  getByRole(roleId: string): Observable<Feature[]> {
    return this.http.getList<Feature>(API.FEATURES.BY_ROLE(roleId));
  }

  create(req: FeatureRequest): Observable<Feature> {
    return this.http.post<Feature>(API.FEATURES.ROOT, req);
  }

  update(featureId: string, req: FeatureRequest): Observable<Feature> {
    return this.http.put<Feature>(API.FEATURES.UPDATE(featureId), req);
  }
}
