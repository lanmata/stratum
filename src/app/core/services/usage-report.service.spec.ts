import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { createHttpSpy, HttpSpy, provideHttpSpy } from '@app/testing/http-spy';
import { API } from '@shared/constants/api.constants';
import { toParams, UsageReportService } from './usage-report.service';

describe('toParams', () => {
  it('keeps only the filters that are set', () => {
    expect(toParams({})).toEqual({});
    expect(toParams({ applicationId: '', from: '', to: '' })).toEqual({});
    expect(toParams({ applicationId: 'a', from: '2026-10-01', to: '2026-10-31' })).toEqual({
      applicationId: 'a',
      from: '2026-10-01',
      to: '2026-10-31',
    });
  });

  it('adds the extra parameters', () => {
    expect(toParams({ from: '2026-10-01' }, { granularity: 'month' })).toEqual({
      granularity: 'month',
      from: '2026-10-01',
    });
  });
});

describe('UsageReportService', () => {
  let http: HttpSpy;
  let service: UsageReportService;

  beforeEach(() => {
    http = createHttpSpy();
    TestBed.configureTestingModule({ providers: [provideHttpSpy(http)] });
    service = TestBed.inject(UsageReportService);
  });

  it('calls each report endpoint with the filters', () => {
    const filters = { applicationId: 'a', from: '2026-10-01', to: '2026-10-31' };
    service.summary(filters).subscribe();
    service.hours(filters).subscribe();
    service.heatmap(filters).subscribe();
    service.applications(filters).subscribe();
    service.clients(filters).subscribe();

    expect(http.get).toHaveBeenCalledWith(API.AUDIT.REPORTS.SUMMARY, filters);
    expect(http.get).toHaveBeenCalledWith(API.AUDIT.REPORTS.HOURS, filters);
    expect(http.get).toHaveBeenCalledWith(API.AUDIT.REPORTS.HEATMAP, filters);
    expect(http.get).toHaveBeenCalledWith(API.AUDIT.REPORTS.APPLICATIONS, filters);
    expect(http.get).toHaveBeenCalledWith(API.AUDIT.REPORTS.CLIENTS, filters);
  });

  it('asks for a week series by default and for the granularity given', () => {
    service.timeSeries().subscribe();
    service.timeSeries({ from: '2026-01-01' }, 'month').subscribe();

    expect(http.get).toHaveBeenCalledWith(API.AUDIT.REPORTS.TIMESERIES, { granularity: 'week' });
    expect(http.get).toHaveBeenCalledWith(API.AUDIT.REPORTS.TIMESERIES, { granularity: 'month', from: '2026-01-01' });
  });

  it('loads every report of the page in parallel', () => {
    http.get.and.callFake(((path: string) => of(path) as never) as never);
    let result: unknown;

    service.all({ applicationId: 'a' }).subscribe((set) => (result = set));

    expect(http.get).toHaveBeenCalledTimes(7);
    expect(result).toEqual({
      summary: API.AUDIT.REPORTS.SUMMARY,
      weekly: API.AUDIT.REPORTS.TIMESERIES,
      monthly: API.AUDIT.REPORTS.TIMESERIES,
      hours: API.AUDIT.REPORTS.HOURS,
      heatmap: API.AUDIT.REPORTS.HEATMAP,
      applications: API.AUDIT.REPORTS.APPLICATIONS,
      clients: API.AUDIT.REPORTS.CLIENTS,
    });
  });
});
