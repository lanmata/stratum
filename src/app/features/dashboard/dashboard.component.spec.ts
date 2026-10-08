import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Dom } from '@app/testing/dom';
import { ApplicationService } from '@core/services/application.service';
import { ContactTypeService } from '@core/services/contact-type.service';
import { NoticeTypeService } from '@core/services/notice-type.service';
import { PersonService } from '@core/services/person.service';
import { ServiceTypeService } from '@core/services/service-type.service';
import { SessionStoreService } from '@core/store/session/session.store.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let user$: BehaviorSubject<unknown>;
  const lists = (n: number) => of(Array.from({ length: n }, (_, i) => ({ id: String(i) })));

  function create(failing = false) {
    user$ = new BehaviorSubject<unknown>({ displayName: 'Ana María' });
    const fail = () => throwError(() => new Error('x'));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: SessionStoreService, useValue: { user$ } },
        { provide: ApplicationService, useValue: { getAll: () => (failing ? fail() : lists(3)) } },
        { provide: PersonService, useValue: { getAll: () => lists(5) } },
        { provide: ContactTypeService, useValue: { getAll: () => lists(2) } },
        { provide: ServiceTypeService, useValue: { getAll: () => lists(1) } },
        { provide: NoticeTypeService, useValue: { getAll: () => lists(0) } },
      ],
    });
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    return new Dom(fixture);
  }

  it('greets the user by first name and shows the counters', () => {
    const dom = create();
    expect(dom.text).toContain('Ana');
    const counters = dom.qa('section[aria-label=Resumen] a p.text-2xl').map((p) => p.textContent!.trim());
    expect(counters).toEqual(['3', '5', '2', '1', '0']);
  });

  it('shows a dash for counters that failed to load', () => {
    const dom = create(true);
    const first = dom.qa('section[aria-label=Resumen] a p.text-2xl')[0];
    expect(first.textContent!.trim()).toBe('—');
  });

  it('falls back to a generic greeting without a display name', () => {
    const dom = create();
    user$.next({});
    dom.fixture.detectChanges();
    expect(dom.text).toContain('bienvenido');
  });

  it('lists navigation cards for the tools group and quick actions', () => {
    const dom = create();
    expect(dom.text).toContain('Herramientas');
    expect(dom.q('a[href="/iam"]')).not.toBeNull();
    expect(dom.q('a[href="/applications/new"]')).not.toBeNull();
  });

  it('chooses the greeting by time of day', () => {
    for (const [hour, text] of [[8, 'Buenos días'], [15, 'Buenas tardes'], [22, 'Buenas noches']] as const) {
      TestBed.resetTestingModule();
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2026, 0, 1, hour));
      const dom = create();
      jasmine.clock().uninstall();
      expect(dom.text).toContain(text);
    }
  });
});
