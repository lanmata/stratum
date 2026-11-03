import { DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { ApplicationService } from '@core/services/application.service';
import { UsageReportService } from '@core/services/usage-report.service';
import { Application } from '@shared/models/application.model';
import { UsageReportSet } from '@shared/models/usage-report.model';
import { lastDays, PRESETS, toIsoDate, UsageReportsComponent } from './usage-reports.component';

const week = (period: string, logins: number, failures = 0) => ({ period, logins, failures, logouts: 0, activeUsers: 1 });

function reportSet(overrides: Partial<UsageReportSet> = {}): UsageReportSet {
  return {
    summary: {
      from: '2026-08-06',
      to: '2026-11-03',
      events: 405,
      logins: 363,
      failures: 30,
      logouts: 10,
      passwordChanges: 2,
      otherEvents: 0,
      activeUsers: 10,
      sourceIps: 5,
      applications: 6,
      failureRate: 30 / 393,
      firstEvent: '2026-08-07T10:00:00',
      lastEvent: '2026-11-03T10:07:00',
    },
    weekly: [week('2026-10-05', 29, 1), week('2026-10-12', 39, 4), week('2026-10-19', 19)],
    monthly: [week('2026-09-01', 12, 9), week('2026-10-01', 121, 6)],
    hours: Array.from({ length: 24 }, (_, hour) => ({ hour, logins: hour === 14 ? 23 : 1 })),
    heatmap: Array.from({ length: 42 }, (_, i) => ({ dayOfWeek: Math.floor(i / 6) + 1, slot: i % 6, logins: i === 2 ? 9 : 0 })),
    applications: [
      { applicationId: 'a1', applicationName: 'Backbone Platform', events: 262, logins: 250, failures: 6, activeUsers: 2, registeredUsers: 1, roles: 1 },
      { applicationId: 'a2', applicationName: 'Smart Kin', events: 3, logins: 3, failures: 0, activeUsers: 1, registeredUsers: 5, roles: 3 },
      { applicationId: 'a3', applicationName: 'LatinHub', events: 0, logins: 0, failures: 0, activeUsers: 0, registeredUsers: 0, roles: 3 },
      { applicationId: null, applicationName: null, events: 4, logins: 0, failures: 4, activeUsers: 3, registeredUsers: 0, roles: 0 },
    ],
    clients: [
      { deviceClass: 'API_CLIENT', browser: 'OTHER', events: 255 },
      { deviceClass: 'DESKTOP_BROWSER', browser: 'CHROME', events: 100 },
    ],
    ...overrides,
  };
}

describe('date helpers', () => {
  it('formats a local date as yyyy-MM-dd', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toIsoDate(new Date(2026, 10, 30))).toBe('2026-11-30');
  });

  it('counts the last N days, today included', () => {
    expect(lastDays(1, new Date(2026, 10, 3))).toEqual({ from: '2026-11-03', to: '2026-11-03' });
    expect(lastDays(90, new Date(2026, 10, 3))).toEqual({ from: '2026-08-06', to: '2026-11-03' });
    expect(lastDays(7).to).toBe(toIsoDate(new Date()));
  });

  it('offers the four presets and a custom range', () => {
    expect(PRESETS.map((p) => p.value)).toEqual(['30', '90', '180', '365', 'custom']);
  });
});

describe('UsageReportsComponent', () => {
  let reports: jasmine.SpyObj<UsageReportService>;
  let applications: jasmine.SpyObj<ApplicationService>;

  async function create(set: unknown = of(reportSet()), apps: unknown = of([{ id: 'a1', name: 'Backbone Platform' }, { id: 'a2', name: 'Smart Kin' }] as Application[])) {
    reports = jasmine.createSpyObj('UsageReportService', ['all']);
    reports.all.and.returnValue(set as never);
    applications = jasmine.createSpyObj('ApplicationService', ['getAll']);
    applications.getAll.and.returnValue(apps as never);
    TestBed.configureTestingModule({
      // The lower charts sit in @defer (on viewport) blocks: render them so every chart can be checked.
      deferBlockBehavior: DeferBlockBehavior.Manual,
      providers: [
        { provide: UsageReportService, useValue: reports },
        { provide: ApplicationService, useValue: applications },
      ],
    });
    const fixture = TestBed.createComponent(UsageReportsComponent);
    fixture.detectChanges();
    const dom = new Dom(fixture);
    await dom.stable();
    for (const block of await fixture.getDeferBlocks()) await block.render(DeferBlockState.Complete);
    await dom.stable();
    return dom;
  }

  it('loads the reports of the last 90 days for every application on start', async () => {
    await create();

    expect(reports.all).toHaveBeenCalledOnceWith({ applicationId: '', from: lastDays(90).from, to: lastDays(90).to });
    expect(applications.getAll).toHaveBeenCalled();
  });

  it('shows the period, the four tiles and every chart', async () => {
    const dom = await create();

    expect(dom.q('.usage-period')?.textContent).toContain('6 ago 2026');
    expect(dom.q('.usage-period')?.textContent).toContain('405');
    const tiles = dom.qa('.usage-tile').map((t) => t.textContent ?? '');
    expect(tiles.length).toBe(4);
    expect(tiles[0]).toContain('363');
    expect(tiles[1]).toContain('10');
    expect(tiles[2]).toContain('3');
    expect(tiles[2]).toContain('de 4 registradas');
    expect(tiles[3]).toContain('7,6 %');
    expect(tiles[3]).toContain('30 de 393 intentos');
    for (const tag of ['app-usage-area-chart', 'app-usage-donut-chart', 'app-usage-bar-list', 'app-usage-hour-columns', 'app-usage-heatmap', 'app-usage-column-chart']) {
      expect(dom.q(tag)).withContext(tag).not.toBeNull();
    }
  });

  it('works out the capacity figures from the series', async () => {
    const dom = await create();
    const capacity = dom.qa('.usage-capacity').map((c) => c.textContent ?? '');

    expect(capacity[0]).toContain('29,0');
    expect(capacity[1]).toContain('39');
    expect(capacity[1]).toContain('12 oct 2026');
    expect(capacity[2]).toContain('14:00');
    expect(capacity[3]).toContain('100 %');
  });

  it('lists every application in the table, naming the events that have none', async () => {
    const dom = await create();
    const rows = dom.qa('.usage-table tbody tr').map((r) => r.textContent ?? '');

    expect(rows.length).toBe(4);
    expect(rows[0]).toContain('Backbone Platform');
    expect(rows[2]).toContain('LatinHub');
    expect(rows[3]).toContain('Sin aplicación');
  });

  it('warns that most events come from API clients, and stays quiet otherwise', async () => {
    const noisy = await create();
    expect(noisy.q('.usage-note')?.textContent).toContain('UMDC_AUDIT_TRUSTED_PROXIES');
    TestBed.resetTestingModule();

    const quiet = await create(of(reportSet({ clients: [{ deviceClass: 'DESKTOP_BROWSER', browser: 'CHROME', events: 90 }, { deviceClass: 'API_CLIENT', browser: 'OTHER', events: 10 }] })));
    expect(quiet.q('.usage-note')).toBeNull();
    TestBed.resetTestingModule();

    const empty = await create(of(reportSet({ clients: [] })));
    expect(empty.q('.usage-note')).toBeNull();
  });

  it('reloads with the dates of the preset chosen', async () => {
    const dom = await create();
    reports.all.calls.reset();

    dom.type('.usage-preset', '30');

    expect(reports.all).toHaveBeenCalledOnceWith({ applicationId: '', from: lastDays(30).from, to: lastDays(30).to });
    expect(dom.q('.usage-from')).toBeNull();
  });

  it('waits for the dates when the range is custom, then loads them', async () => {
    const dom = await create();
    reports.all.calls.reset();

    dom.type('.usage-preset', 'custom');
    expect(reports.all).not.toHaveBeenCalled();
    dom.type('.usage-from', '2026-10-01');
    dom.type('.usage-to', '2026-10-31');
    dom.fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    dom.fixture.detectChanges();

    expect(reports.all).toHaveBeenCalledOnceWith({ applicationId: '', from: '2026-10-01', to: '2026-10-31' });
  });

  it('filters by application', async () => {
    const dom = await create();
    reports.all.calls.reset();

    dom.type('.usage-app', 'a2');
    dom.click('.usage-apply');

    expect(reports.all.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ applicationId: 'a2' }));
    expect(dom.qa('.usage-app option').map((o) => o.textContent?.trim())).toEqual(['Todas', 'Backbone Platform', 'Smart Kin']);
  });

  it('shows a loading panel until the first answer and dims the board while it refreshes', async () => {
    const pending = new Subject<UsageReportSet>();
    const dom = await create(pending);
    expect(dom.q('.usage-loading')).not.toBeNull();
    expect(dom.q('.usage-board')).toBeNull();

    pending.next(reportSet());
    pending.complete();
    await dom.stable();
    expect(dom.q('.usage-loading')).toBeNull();
    expect(dom.q('.usage-board')).not.toBeNull();

    const again = new Subject<UsageReportSet>();
    reports.all.and.returnValue(again as never);
    dom.click('.usage-apply');
    expect(dom.q('.usage-board')?.classList).toContain('opacity-60');
    expect(dom.q<HTMLButtonElement>('.usage-apply')?.disabled).toBeTrue();
  });

  it('explains an invalid period and lets the person retry', async () => {
    const dom = await create(throwError(() => ({ status: 400 })));

    expect(dom.q('.usage-error')?.textContent).toContain('El periodo no es válido');

    reports.all.and.returnValue(of(reportSet()));
    dom.click('.usage-retry');
    await dom.stable();
    expect(dom.q('.usage-error')).toBeNull();
    expect(dom.q('.usage-board')).not.toBeNull();
  });

  it('shows a generic message for any other failure', async () => {
    const dom = await create(throwError(() => ({ status: 500 })));

    expect(dom.q('.usage-error')?.textContent).toContain('No se pudieron cargar los reportes');
  });

  it('copes with an error that carries no status', async () => {
    const dom = await create(throwError(() => undefined));

    expect(dom.q('.usage-error')?.textContent).toContain('No se pudieron cargar los reportes');
  });

  it('still works when the list of applications cannot be loaded', async () => {
    const dom = await create(of(reportSet()), throwError(() => new Error('down')));

    expect(dom.qa('.usage-app option').length).toBe(1);
    expect(dom.q('.usage-board')).not.toBeNull();
  });
});
