import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { AuditService } from '@core/services/audit.service';
import { AuditEvent } from '@shared/models/audit.model';
import { AuditListComponent, toCsv, toQuery } from './audit-list.component';

const event = (n: number, extra: Partial<AuditEvent> = {}): AuditEvent => ({
  id: `e${n}`,
  userId: `u${n}`,
  applicationId: `a${n}`,
  eventType: 'LOGIN_SUCCESS',
  ipAddress: '10.0.0.1',
  occurredAt: `2026-01-0${n} 10:00:00`,
  details: 'ok',
  ...extra,
});

describe('audit helpers', () => {
  it('builds a query from filled filters only, adding seconds to datetimes', () => {
    expect(toQuery({ eventType: '', userId: '  ', applicationId: '', from: '', to: '' })).toEqual({});
    expect(
      toQuery({ eventType: 'LOGOUT', userId: ' u ', applicationId: ' a ', from: '2026-01-01T10:00', to: '2026-01-02T11:30' }),
    ).toEqual({
      eventType: 'LOGOUT',
      userId: 'u',
      applicationId: 'a',
      from: '2026-01-01T10:00:00',
      to: '2026-01-02T11:30:00',
    });
  });

  it('serialises events to csv escaping quotes and falling back to createdAt', () => {
    const csv = toCsv([
      event(1, { details: 'said "hi"' }),
      { id: 'x', eventType: 'LOGOUT', createdAt: 'c' },
    ]);
    const [header, first, second] = csv.split('\n');
    expect(header).toBe('id,eventType,userId,applicationId,ipAddress,occurredAt,details');
    expect(first).toContain('"said ""hi"""');
    expect(second).toBe('"x","LOGOUT","","","","c",""');
  });
});

describe('AuditListComponent', () => {
  let service: jasmine.SpyObj<AuditService>;

  async function create(platform = 'browser', first: unknown = of([event(1), event(2, { occurredAt: undefined, createdAt: 'created', details: null, applicationId: null })])) {
    service = jasmine.createSpyObj('AuditService', ['getEvents', 'exportEvents']);
    service.getEvents.and.returnValue(first as never);
    service.exportEvents.and.returnValue(of([event(1)]));
    TestBed.configureTestingModule({
      providers: [
        { provide: AuditService, useValue: service },
        { provide: PLATFORM_ID, useValue: platform },
      ],
    });
    const fixture = TestBed.createComponent(AuditListComponent);
    fixture.detectChanges();
    const dom = new Dom(fixture);
    await dom.stable();
    return dom;
  }

  it('loads the first page and renders the event columns', async () => {
    const dom = await create();
    expect(service.getEvents).toHaveBeenCalledWith({ page: 0, size: 20 });
    expect(dom.text).toContain('LOGIN_SUCCESS');
    expect(dom.text).toContain('10.0.0.1');
    expect(dom.text).toContain('2026-01-01 10:00:00');
    expect(dom.text).toContain('created');
    expect(dom.text).toContain('1–2 eventos');
  });

  it('shows the empty state and stops loading on errors', async () => {
    expect((await create('browser', of([]))).text).toContain('No se encontraron eventos');
    TestBed.resetTestingModule();
    expect((await create('browser', throwError(() => new Error('x')))).text).not.toContain('Cargando');
  });

  it('applies and clears filters, resetting to the first page', async () => {
    const dom = await create();
    dom.type('select[aria-label="Tipo de evento"]', 'LOGOUT');
    dom.type('input[aria-label="ID de usuario"]', ' u1 ');
    dom.type('input[aria-label="ID de aplicación"]', 'a1');
    dom.type('input[aria-label=Desde]', '2026-01-01T00:00');
    dom.type('input[aria-label=Hasta]', '2026-01-31T23:59');
    dom.submit('form');
    expect(service.getEvents.calls.mostRecent().args[0]).toEqual({
      eventType: 'LOGOUT',
      userId: 'u1',
      applicationId: 'a1',
      from: '2026-01-01T00:00:00',
      to: '2026-01-31T23:59:00',
      page: 0,
      size: 20,
    });

    dom.clickByText('button', 'Limpiar');
    await dom.stable();
    expect(service.getEvents.calls.mostRecent().args[0]).toEqual({ page: 0, size: 20 });
    expect(dom.q<HTMLInputElement>('input[aria-label="ID de usuario"]')!.value).toBe('');
  });

  it('changes the page size and paginates', async () => {
    const full = Array.from({ length: 20 }, (_, i) => event(i % 9 + 1));
    const dom = await create('browser', of(full));
    expect(dom.text).toContain('1–20 eventos');
    dom.clickByText('button', 'Siguiente');
    expect(service.getEvents.calls.mostRecent().args[0]).toEqual({ page: 1, size: 20 });
    expect(dom.text).toContain('Página 2');
    dom.clickByText('button', 'Anterior');
    expect(service.getEvents.calls.mostRecent().args[0]).toEqual({ page: 0, size: 20 });

    dom.pick('select:not([aria-label])', 0);
    expect(service.getEvents.calls.mostRecent().args[0]).toEqual({ page: 0, size: 10 });
  });

  it('does not page past the ends', async () => {
    const dom = await create();
    expect(dom.qa<HTMLButtonElement>('button').find((b) => b.textContent!.includes('Anterior'))!.disabled).toBeTrue();
    expect(dom.qa<HTMLButtonElement>('button').find((b) => b.textContent!.includes('Siguiente'))!.disabled).toBeTrue();
    const calls = service.getEvents.calls.count();
    (dom.fixture.componentInstance as unknown as { prevPage(): void; nextPage(): void }).prevPage();
    (dom.fixture.componentInstance as unknown as { prevPage(): void; nextPage(): void }).nextPage();
    expect(service.getEvents.calls.count()).toBe(calls);
  });

  it('exports with the applied filters, not the unsaved ones', async () => {
    const dom = await create();
    const click = spyOn(HTMLAnchorElement.prototype, 'click');
    spyOn(URL, 'createObjectURL').and.returnValue('blob:x');
    spyOn(URL, 'revokeObjectURL');
    dom.type('select[aria-label="Tipo de evento"]', 'LOGOUT');
    dom.submit('form');
    dom.type('input[aria-label="ID de usuario"]', 'unsaved');
    dom.clickByText('button', 'Export CSV');
    expect(service.exportEvents).toHaveBeenCalledWith({ eventType: 'LOGOUT' });
    expect(click).toHaveBeenCalled();
    expect(dom.text).toContain('Export CSV');
  });

  it('recovers from export errors and does nothing on the server', async () => {
    const dom = await create();
    service.exportEvents.and.returnValue(throwError(() => new Error('x')));
    dom.clickByText('button', 'Export CSV');
    expect(dom.text).toContain('Export CSV');

    TestBed.resetTestingModule();
    const server = await create('server');
    server.clickByText('button', 'Export CSV');
    expect(service.exportEvents).not.toHaveBeenCalled();
  });
});
