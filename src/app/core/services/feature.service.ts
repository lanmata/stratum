import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import { Feature, FeatureRequest } from '@shared/models/feature.model';

@Injectable({ providedIn: 'root' })
export class FeatureService {
  private readonly http = inject(HttpService);

  getAll(includeInactive = false): Observable<Feature[]> {
    return this.http.get<Feature[]>(API.FEATURES.WITH_INACTIVE(includeInactive));
  }

  getById(featureId: string): Observable<Feature> {
    return this.http.get<Feature>(API.FEATURES.BY_ID(featureId));
  }

  create(req: FeatureRequest): Observable<Feature> {
    return this.http.post<Feature>(`/v1/features/`, req);
  }

  update(featureId: string, req: FeatureRequest): Observable<Feature> {
    return this.http.put<Feature>(`/v1/features/${featureId}`, req);
  }
}
