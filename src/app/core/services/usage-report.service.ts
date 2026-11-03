import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { API } from '@shared/constants/api.constants';
import {
  ApplicationUsage,
  ClientBreakdown,
  Granularity,
  HeatCell,
  HourBucket,
  UsageFilters,
  UsagePoint,
  UsageReportSet,
  UsageSummary,
} from '@shared/models/usage-report.model';
import { HttpService } from './http.service';

type Params = Record<string, string | number | boolean | string[] | undefined>;

/** Drops the filters that are not set, so they are not sent as empty parameters. */
export function toParams(filters: UsageFilters, extra: Params = {}): Params {
  const params: Params = { ...extra };
  if (filters.applicationId) params['applicationId'] = filters.applicationId;
  if (filters.from) params['from'] = filters.from;
  if (filters.to) params['to'] = filters.to;
  return params;
}

/** Usage and access reports of the audit trail (backbone `/iam/audit/reports`, feature `AUDIT_READ`). */
@Injectable({ providedIn: 'root' })
export class UsageReportService {
  private readonly http = inject(HttpService);

  summary(filters: UsageFilters = {}): Observable<UsageSummary> {
    return this.http.get<UsageSummary>(API.AUDIT.REPORTS.SUMMARY, toParams(filters));
  }

  timeSeries(filters: UsageFilters = {}, granularity: Granularity = 'week'): Observable<UsagePoint[]> {
    return this.http.get<UsagePoint[]>(API.AUDIT.REPORTS.TIMESERIES, toParams(filters, { granularity }));
  }

  hours(filters: UsageFilters = {}): Observable<HourBucket[]> {
    return this.http.get<HourBucket[]>(API.AUDIT.REPORTS.HOURS, toParams(filters));
  }

  heatmap(filters: UsageFilters = {}): Observable<HeatCell[]> {
    return this.http.get<HeatCell[]>(API.AUDIT.REPORTS.HEATMAP, toParams(filters));
  }

  applications(filters: UsageFilters = {}): Observable<ApplicationUsage[]> {
    return this.http.get<ApplicationUsage[]>(API.AUDIT.REPORTS.APPLICATIONS, toParams(filters));
  }

  clients(filters: UsageFilters = {}): Observable<ClientBreakdown[]> {
    return this.http.get<ClientBreakdown[]>(API.AUDIT.REPORTS.CLIENTS, toParams(filters));
  }

  /** Every report the usage page shows, loaded in parallel. */
  all(filters: UsageFilters = {}): Observable<UsageReportSet> {
    return forkJoin({
      summary: this.summary(filters),
      weekly: this.timeSeries(filters, 'week'),
      monthly: this.timeSeries(filters, 'month'),
      hours: this.hours(filters),
      heatmap: this.heatmap(filters),
      applications: this.applications(filters),
      clients: this.clients(filters),
    }).pipe(map((set) => set));
  }
}
