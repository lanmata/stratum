import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { API } from '@shared/constants/api.constants';
import {
  Feature,
  FeatureRequest,
  FeatureRoleLink,
  FeatureSearchParams,
  FeatureSummary,
} from '@shared/models/feature.model';
import { Page } from '@shared/models/page.model';

@Injectable({ providedIn: 'root' })
export class FeatureService {
  private readonly http = inject(HttpService);

  /** The catalog is only ever read one server-side page at a time, never whole. */
  search(params: FeatureSearchParams = {}): Observable<Page<FeatureSummary>> {
    return this.http.get<Page<FeatureSummary>>(API.FEATURES.SEARCH, {
      q: params.q?.trim() || undefined,
      active: params.active,
      page: params.page ?? 0,
      size: params.size ?? 20,
    });
  }

  getRoles(featureId: string, page = 0, size = 20): Observable<Page<FeatureRoleLink>> {
    return this.http.get<Page<FeatureRoleLink>>(API.FEATURES.ROLES(featureId), { page, size });
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
